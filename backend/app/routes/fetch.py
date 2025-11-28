"""
RAG Document Fetch Route
Uses vLLM endpoint for embeddings and searches through parquet data lake
"""

from flask import Blueprint, request, jsonify
import numpy as np
import os
import logging
import time
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)

fetch_bp = Blueprint("fetch", __name__)

# ----------------- Configuration -----------------

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data_lake", "text")
TOP_K = 20

# vLLM endpoint - load from .env
VLLM_API_URL = os.environ.get("VLLM_API_URL", "http://localhost:8000/v1")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "intfloat/e5-mistral-7b-instruct")

logger.info(f"📡 vLLM URL configured: {VLLM_API_URL}")

# ----------------- Pydantic Models -----------------


class FetchRequest(BaseModel):
    """Input model for fetch request"""

    query: str = Field(..., description="Search query for RAG retrieval")
    top_k: int = Field(
        default=20, ge=1, le=100, description="Number of documents to return"
    )


class Document(BaseModel):
    """Retrieved document"""

    score: float
    code: str
    url: str
    text: str


class FetchResponse(BaseModel):
    """Response model"""

    query: str
    num_results: int
    search_time_ms: float
    documents: List[Document]


# ----------------- Search Engine -----------------


class RAGSearchEngine:
    """
    RAG Search Engine using vLLM for embeddings
    Loads parquet files and performs cosine similarity search on CPU (M4 Mac compatible)
    """

    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if RAGSearchEngine._initialized:
            return

        logger.info("🔌 Initializing RAG Search Engine...")
        self.client = None
        self.df = None
        self.vectors = None
        self.initialized = False

    def _lazy_init(self):
        """Lazy initialization - only load when first query comes in"""
        if self.initialized:
            return True

        try:
            # Initialize OpenAI client for vLLM
            logger.info(f"🔌 Connecting to vLLM at {VLLM_API_URL}...")
            self.client = OpenAI(base_url=VLLM_API_URL, api_key="EMPTY")

            # Load parquet data
            logger.info(f"📂 Loading Parquet Data Lake from {DATA_DIR}...")
            self._load_index()

            self.initialized = True
            RAGSearchEngine._initialized = True
            logger.info(f"🚀 Engine Ready. Indexed {len(self.df):,} documents.")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to initialize search engine: {e}")
            return False

    def _load_index(self):
        """Load parquet files and build numpy index"""
        try:
            import pyarrow.parquet as pq
            import pyarrow as pa

            # Get all parquet files
            parquet_files = [
                os.path.join(DATA_DIR, f)
                for f in os.listdir(DATA_DIR)
                if f.endswith(".parquet")
            ]

            if not parquet_files:
                raise ValueError(f"No parquet files found in {DATA_DIR}")

            logger.info(f"  Found {len(parquet_files)} parquet files")

            # Read all parquet files
            tables = []
            for f in parquet_files:
                try:
                    tables.append(pq.read_table(f))
                except Exception as e:
                    logger.warning(f"  Skipping {f}: {e}")

            if not tables:
                raise ValueError("Failed to read any parquet files")

            # Concatenate all tables
            combined = pa.concat_tables(tables)
            self.df = combined.to_pandas()

            logger.info(f"  Loaded {len(self.df):,} documents")
            logger.info(f"  Columns: {self.df.columns.tolist()}")

            # Extract vectors
            if "vector" not in self.df.columns:
                raise ValueError("No 'vector' column found in parquet files")

            logger.info("📐 Building CPU Index...")

            # Stack vectors into numpy array
            # Vectors are stored as int8 (quantized), convert to float32
            vecs = np.stack(self.df["vector"].values)

            # De-quantize (divide by 100) and normalize
            self.vectors = vecs.astype(np.float32) / 100.0

            # Pre-normalize for cosine similarity
            norms = np.linalg.norm(self.vectors, axis=1, keepdims=True)
            norms = np.where(norms == 0, 1, norms)  # Avoid division by zero
            self.vectors = self.vectors / norms

            logger.info(f"  Vector shape: {self.vectors.shape}")

        except ImportError:
            logger.error("❌ pyarrow not installed. Run: pip install pyarrow")
            raise
        except Exception as e:
            logger.error(f"❌ Failed to load index: {e}")
            raise

    def get_embedding(self, text: str) -> Optional[np.ndarray]:
        """Get embedding from vLLM endpoint"""
        # E5-Mistral instruction format
        formatted_query = f"Instruct: Retrieve financial insights.\nQuery: {text}"

        try:
            response = self.client.embeddings.create(
                input=[formatted_query], model=EMBEDDING_MODEL
            )
            return np.array(response.data[0].embedding, dtype=np.float32)
        except Exception as e:
            logger.error(f"❌ Embedding API error: {e}")
            return None

    def search(self, query: str, top_k: int = TOP_K) -> tuple:
        """
        Search for relevant documents
        Returns: (results, search_time_ms)
        """
        if not self._lazy_init():
            return [], 0

        t0 = time.time()

        # 1. Get query embedding
        query_vec = self.get_embedding(query)
        if query_vec is None:
            return [], 0

        # 2. Normalize query vector
        query_norm = np.linalg.norm(query_vec)
        if query_norm > 0:
            query_vec = query_vec / query_norm

        # 3. Cosine similarity via dot product (vectors are pre-normalized)
        scores = np.dot(self.vectors, query_vec)

        # 4. Get top K indices
        top_indices = np.argsort(scores)[::-1][:top_k]

        # 5. Build results
        results = []
        for idx in top_indices:
            row = self.df.iloc[idx]
            results.append(
                {
                    "score": float(scores[idx]),
                    "code": str(row.get("code", "")),
                    "url": str(row.get("url", "")),
                    "text": str(row.get("text", ""))[:1000],  # Limit text length
                }
            )

        search_time_ms = (time.time() - t0) * 1000
        logger.info(f"⚡ Search completed in {search_time_ms:.2f}ms")

        return results, search_time_ms


# Global engine instance (lazy loaded)
search_engine = RAGSearchEngine()


# ----------------- Flask Route -----------------


@fetch_bp.route("/fetch", methods=["POST"])
def fetch_route():
    """
    RAG Document Fetch endpoint.

    Input JSON:
    {
        "query": "companies with strong revenue growth",
        "top_k": 20
    }

    Returns top K relevant documents from the data lake.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON payload"}), 400

        # Validate input
        try:
            req = FetchRequest(**data)
        except Exception as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400

        logger.info(f"🔎 Searching: '{req.query[:50]}...' (top_k={req.top_k})")

        # Perform search
        results, search_time_ms = search_engine.search(req.query, req.top_k)

        if not results:
            return (
                jsonify(
                    {
                        "error": "Search failed - check vLLM endpoint connection",
                        "vllm_url": VLLM_API_URL,
                    }
                ),
                500,
            )

        # Build response
        response = FetchResponse(
            query=req.query,
            num_results=len(results),
            search_time_ms=round(search_time_ms, 2),
            documents=[Document(**r) for r in results],
        )

        return jsonify(response.model_dump())

    except Exception as e:
        import traceback

        logger.error(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@fetch_bp.route("/fetch/health", methods=["GET"])
def fetch_health():
    """Health check for the fetch endpoint"""
    return jsonify(
        {
            "status": "ok",
            "vllm_url": VLLM_API_URL,
            "embedding_model": EMBEDDING_MODEL,
            "data_dir": DATA_DIR,
            "engine_initialized": search_engine.initialized,
        }
    )
