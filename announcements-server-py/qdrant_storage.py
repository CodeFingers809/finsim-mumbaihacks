"""
Qdrant client for storing BSE announcements with hybrid embeddings
and matching against user queries.
"""

import os
import requests
import uuid
from typing import List, Dict, Any, Tuple
from qdrant_client import QdrantClient, models
from dotenv import load_dotenv

# Try importing SPLADE
try:
    from fastembed import SparseTextEmbedding
    SPLADE_AVAILABLE = True
except ImportError:
    print("Warning: fastembed not installed. Install with: pip install fastembed")
    SPLADE_AVAILABLE = False

load_dotenv()

# Configuration
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
VLLM_URL = os.getenv("VLLM_EMBEDDING_URL")
SPLADE_URL = os.getenv("SPLADE_EMBEDDING_URL", "http://localhost:8003/v1/embeddings")

ANNOUNCEMENTS_COLLECTION = "bse_announcements"
USER_COLLECTION = "user_embeddings"
SIMILARITY_THRESHOLD = 0.75

# Initialize SPLADE model
sparse_model = None
if SPLADE_AVAILABLE:
    try:
        sparse_model = SparseTextEmbedding("prithivida/Splade_PP_en_v1")
    except Exception as e:
        print(f"Warning: Could not load SPLADE model: {e}")


class QdrantAnnouncementStore:
    def __init__(self):
        if not QDRANT_URL or not QDRANT_API_KEY:
            raise ValueError("QDRANT_URL and QDRANT_API_KEY must be set")
        
        if not VLLM_URL:
            raise ValueError("VLLM_EMBEDDING_URL must be set")

        self.client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
        self._ensure_collections()

    def _ensure_collections(self):
        """Ensure both collections exist"""
        # Check announcements collection
        try:
            self.client.get_collection(ANNOUNCEMENTS_COLLECTION)
            print(f"✓ {ANNOUNCEMENTS_COLLECTION} collection exists")
        except Exception:
            print(f"Creating {ANNOUNCEMENTS_COLLECTION} collection...")
            self.client.create_collection(
                collection_name=ANNOUNCEMENTS_COLLECTION,
                vectors_config={
                    "dense": models.VectorParams(
                        size=4096,  # e5-mistral-7b-instruct
                        distance=models.Distance.COSINE,
                    )
                },
                sparse_vectors_config={"sparse": models.SparseVectorParams()},
            )

    def get_dense_embedding(self, text: str) -> List[float]:
        """Get dense embeddings from vLLM"""
        response = requests.post(
            VLLM_URL,
            json={"input": [text]},
            timeout=120
        )
        response.raise_for_status()
        data = response.json()
        return data["data"][0]["embedding"]

    def get_sparse_embedding_remote(self, text: str) -> Dict[str, List]:
        """Get sparse embeddings from SPLADE server"""
        response = requests.post(
            SPLADE_URL,
            json={"input": [text]},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        emb = data["data"][0]["embedding"]
        return {"indices": emb["indices"], "values": emb["values"]}

    def get_sparse_embedding_local(self, text: str) -> Dict[str, List]:
        """Get sparse embeddings using local SPLADE model"""
        if not sparse_model:
            raise RuntimeError("SPLADE model not available")
        
        embeddings = list(sparse_model.embed([text]))
        emb = embeddings[0]
        return {
            "indices": emb.indices.tolist(),
            "values": emb.values.tolist(),
        }

    def get_sparse_embedding(self, text: str) -> Dict[str, List]:
        """Get sparse embeddings (try remote first, fallback to local)"""
        try:
            return self.get_sparse_embedding_remote(text)
        except Exception as e:
            print(f"Remote SPLADE failed, trying local: {e}")
            if sparse_model:
                return self.get_sparse_embedding_local(text)
            raise RuntimeError("No SPLADE embedding method available")

    def deterministic_point_id(self, file_hash: str, chunk_index: int = 0) -> str:
        """Generate deterministic UUID for announcement"""
        namespace = uuid.UUID("12345678-1234-5678-1234-567812345678")
        return str(uuid.uuid5(namespace, f"{file_hash}_{chunk_index}"))

    def store_announcement(
        self,
        text: str,
        metadata: Dict[str, Any]
    ) -> str:
        """
        Store a single announcement in Qdrant with hybrid embeddings.
        
        Args:
            text: The announcement text content
            metadata: Dict with keys like stock_code, stock_name, category, 
                     subject, date_time, pdf_url, file_hash
        
        Returns:
            The point_id of the stored announcement
        """
        file_hash = metadata.get("file_hash", str(uuid.uuid4()))
        point_id = self.deterministic_point_id(file_hash)

        # Check if already exists
        try:
            existing = self.client.retrieve(
                ANNOUNCEMENTS_COLLECTION,
                ids=[point_id]
            )
            if existing:
                print(f"   ⏭️  Announcement {point_id[:8]} already exists, skipping")
                return point_id
        except Exception:
            pass

        # Get embeddings
        print(f"   🔢 Generating embeddings...")
        dense_emb = self.get_dense_embedding(text)
        sparse_emb = self.get_sparse_embedding(text)

        # Store in Qdrant
        point = models.PointStruct(
            id=point_id,
            vector={
                "dense": dense_emb,
                "sparse": models.SparseVector(
                    indices=sparse_emb["indices"],
                    values=sparse_emb["values"],
                ),
            },
            payload={
                "text": text[:5000],  # Limit payload size
                "stock_code": metadata.get("stock_code"),
                "stock_name": metadata.get("stock_name"),
                "category": metadata.get("category"),
                "subject": metadata.get("subject"),
                "date_time": metadata.get("date_time"),
                "pdf_url": metadata.get("pdf_url"),
                "file_hash": file_hash,
            },
        )

        self.client.upsert(
            collection_name=ANNOUNCEMENTS_COLLECTION,
            points=[point],
            wait=True,
        )

        print(f"   ✅ Stored in Qdrant: {point_id[:8]}")
        return point_id

    def find_matching_users(
        self,
        announcement_text: str,
        stock_code: str = None,
        category: str = None
    ) -> List[Dict[str, Any]]:
        """
        Find users whose queries match this announcement above threshold.
        
        Returns list of matching user payloads with their phone numbers.
        """
        print(f"   🔍 Searching for matching users...")
        
        # Get announcement embeddings
        dense_emb = self.get_dense_embedding(announcement_text)

        # Search user embeddings collection
        try:
            results = self.client.search(
                collection_name=USER_COLLECTION,
                query_vector=("dense", dense_emb),
                limit=100,
                score_threshold=SIMILARITY_THRESHOLD,
                with_payload=True,
            )

            matched_users = []
            for hit in results:
                payload = hit.payload
                score = hit.score
                
                # Optional: filter by scrips/baskets
                user_scrips = payload.get("scrips", [])
                user_baskets = payload.get("baskets", [])
                
                # Simple filtering logic
                if user_scrips and stock_code:
                    if stock_code not in user_scrips:
                        continue
                
                matched_users.append({
                    "userId": payload.get("userId"),
                    "phoneNumber": payload.get("phoneNumber"),
                    "query": payload.get("query"),
                    "score": score,
                })

            print(f"   ✅ Found {len(matched_users)} matching users")
            return matched_users

        except Exception as e:
            print(f"   ❌ Error searching users: {e}")
            return []


if __name__ == "__main__":
    # Test
    store = QdrantAnnouncementStore()
    print("✓ Qdrant store initialized")
