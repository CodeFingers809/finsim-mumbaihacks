"""
Advanced Agentic RAG Pipeline
Features:
- Query Expansion (synonyms, related terms)
- Sub-Question Decomposition
- Hypothetical Document Embedding (HyDE)
- Step-Back Prompting
- Multi-hop Retrieval with Relevance Checking
"""

from flask import Blueprint, request, jsonify, Response
import numpy as np
import os
import logging
import time
import json
import requests
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv
import google.generativeai as genai
from qdrant_client import QdrantClient
from qdrant_client.http import models

load_dotenv()

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)

agentic_rag_bp = Blueprint("agentic_rag", __name__)

# ----------------- Configuration -----------------

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data_lake", "text")
TOP_K = 20
MAX_ITERATIONS = 3

EMBEDDING_URL = os.environ.get("EMBEDDING_URL", "http://localhost:8000/v1")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "intfloat/e5-mistral-7b-instruct")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    logger.info("✅ Gemini API configured")

# ----------------- Pydantic Models -----------------


class AgenticRequest(BaseModel):
    query: str = Field(..., description="Search query")
    top_k: int = Field(default=20, ge=1, le=100)
    max_iterations: int = Field(default=3, ge=1, le=5)


class DataPoint(BaseModel):
    """A specific data point extracted from documents"""
    label: str
    value: str
    unit: Optional[str] = None
    trend: Optional[str] = None  # up, down, stable


class DocumentInsight(BaseModel):
    """Rich document representation"""
    title: str
    description: str
    relevance_score: float
    data_points: List[DataPoint]
    key_quote: str
    non_technical_insight: str
    actionable_takeaway: str
    source_url: str
    source_code: str
    confidence: float


# ----------------- Advanced RAG Functions -----------------


def extract_json(text: str) -> Any:
    """Helper to extract JSON from text that might contain markdown code blocks"""
    text = text.strip()
    
    # If it's already valid JSON, return it
    try:
        return json.loads(text)
    except:
        pass
    
    if "```" in text:
        # Try to find the first JSON block
        try:
            # Split by ``` and look for the block that looks like JSON
            parts = text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{") or part.startswith("["):
                    try:
                        return json.loads(part)
                    except:
                        continue
        except:
            pass
    
    # Fallback: try to find the first { or [ and the last } or ]
    # Try multiple strategies
    strategies = [
        # Strategy 1: Find matching braces
        lambda t: _extract_matching_json(t),
        # Strategy 2: Find first { to last }
        lambda t: t[t.find("{"):t.rfind("}")+1] if "{" in t and "}" in t else None,
        # Strategy 3: Find first [ to last ]
        lambda t: t[t.find("["):t.rfind("]")+1] if "[" in t and "]" in t else None,
    ]
    
    for strategy in strategies:
        try:
            extracted = strategy(text)
            if extracted:
                return json.loads(extracted)
        except:
            continue
            
    logger.warning(f"JSON extraction failed for text: {text[:100]}...")
    return None


def _extract_matching_json(text: str) -> Optional[str]:
    """Extract JSON by finding matching braces/brackets"""
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        start_idx = text.find(start_char)
        if start_idx == -1:
            continue
            
        depth = 0
        for i in range(start_idx, len(text)):
            if text[i] == start_char:
                depth += 1
            elif text[i] == end_char:
                depth -= 1
                if depth == 0:
                    return text[start_idx:i+1]
    return None


def expand_query(query: str) -> Dict[str, Any]:
    """
    Query Expansion: Generate synonyms, related terms, and alternative phrasings
    """
    if not GOOGLE_API_KEY:
        return {"expanded_queries": [query], "search_terms": [query]}
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""You are a financial research query expander. Expand this query with synonyms, related concepts, and alternative phrasings.

Query: "{query}"

Generate expansions that would help find relevant financial documents. Consider:
1. Synonyms (e.g., "revenue" → "sales", "income", "top-line")
2. Related metrics (e.g., "growth" → "CAGR", "YoY change", "expansion rate")
3. Industry terms (e.g., "profit" → "EBITDA", "net income", "operating margin")
4. Broader/narrower concepts

Return JSON:
{{
    "interpreted_intent": "what the user actually wants to know",
    "expanded_queries": ["query variant 1", "query variant 2", "query variant 3"],
    "search_terms": ["term1", "term2", "term3", "term4", "term5"],
    "domain": "finance|tech|healthcare|general"
}}"""

        response = model.generate_content(prompt, generation_config=genai.GenerationConfig(
            temperature=0.3, max_output_tokens=500
        ))
        
        # Check if response was blocked or empty
        if not response.candidates or not response.candidates[0].content.parts:
            logger.warning(f"Query expansion: Response blocked or empty")
            return {"expanded_queries": [query], "search_terms": query.split(), "interpreted_intent": query}
        
        result = extract_json(response.text)
        if not result:
            logger.warning(f"Query expansion: Could not parse JSON from response: {response.text[:100]}...")
            return {"expanded_queries": [query], "search_terms": query.split(), "interpreted_intent": query}
            
        return result
    except Exception as e:
        logger.error(f"Query expansion error: {e}")
        return {"expanded_queries": [query], "search_terms": query.split(), "interpreted_intent": query}


def decompose_into_subquestions(query: str, intent: str) -> List[str]:
    """
    Sub-Question Decomposition: Break complex queries into simpler sub-questions
    """
    if not GOOGLE_API_KEY:
        return [query]
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""Break down this financial research question into 2-4 simpler sub-questions that together would fully answer the original query.

Original Query: "{query}"
Interpreted Intent: "{intent}"

Each sub-question should:
1. Be independently answerable
2. Cover a specific aspect of the main question
3. Be phrased to find relevant documents

Return JSON array:
["sub-question 1", "sub-question 2", "sub-question 3"]

Return ONLY the JSON array."""

        response = model.generate_content(prompt, generation_config=genai.GenerationConfig(
            temperature=0.3, max_output_tokens=300
        ))
        
        # Check if response was blocked or empty
        if not response.candidates or not response.candidates[0].content.parts:
            logger.warning(f"Sub-question decomposition: Response blocked or empty")
            return [query]
        
        result = extract_json(response.text)
        if not result:
            logger.warning(f"Sub-question decomposition: Could not parse JSON")
            return [query]
            
        return result
    except Exception as e:
        logger.error(f"Sub-question decomposition error: {e}")
        return [query]


def generate_step_back_question(query: str) -> str:
    """
    Step-Back Prompting: Generate a more general/abstract question to get broader context
    """
    if not GOOGLE_API_KEY:
        return query
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""Generate a "step-back" question for this query. A step-back question is a more general/abstract version that provides broader context.

Original Query: "{query}"

Examples:
- "What is Apple's revenue growth?" → "What are the key financial metrics for evaluating tech companies?"
- "Is Tesla overvalued?" → "What valuation methods are used for growth stocks?"
- "Best dividend stocks 2024" → "What characteristics define quality dividend-paying companies?"

Return ONLY the step-back question, no explanation."""

        response = model.generate_content(prompt, generation_config=genai.GenerationConfig(
            temperature=0.3, max_output_tokens=100
        ))
        
        # Check if response was blocked or empty
        if not response.candidates or not response.candidates[0].content.parts:
            logger.warning(f"Step-back question: Response blocked or empty")
            return query
        
        return response.text.strip().strip('"')
    except Exception as e:
        logger.error(f"Step-back question error: {e}")
        return query


def generate_hypothetical_answer(query: str, intent: str) -> str:
    """
    HyDE: Generate a hypothetical ideal answer to use for semantic search
    This helps find documents that would contain such an answer
    """
    if not GOOGLE_API_KEY:
        return query
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""Generate a hypothetical ideal answer paragraph that would perfectly answer this financial query. This will be used to find similar content.

Query: "{query}"
Intent: "{intent}"

Write a 2-3 sentence answer as if it came from a high-quality financial document. Include specific but plausible details, metrics, and insights.

Return ONLY the hypothetical answer text, no explanations."""

        response = model.generate_content(prompt, generation_config=genai.GenerationConfig(
            temperature=0.5, max_output_tokens=200
        ))
        
        # Check if response was blocked or empty
        if not response.candidates or not response.candidates[0].content.parts:
            logger.warning(f"HyDE: Response blocked or empty")
            return query
        
        return response.text.strip()
    except Exception as e:
        logger.error(f"HyDE error: {e}")
        return query


def extract_document_insights(query: str, documents: List[Dict]) -> List[Dict]:
    """
    Extract rich insights from each document
    """
    if not GOOGLE_API_KEY or not documents:
        return documents
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        docs_for_analysis = documents[:10]
        docs_json = json.dumps([{
            "id": i,
            "text": doc.get("text", "")[:1200],
            "code": doc.get("code", ""),
            "url": doc.get("url", ""),
            "score": doc.get("score", 0)
        } for i, doc in enumerate(docs_for_analysis)], indent=2)
        
        prompt = f"""Analyze these financial documents and extract insights for each.

Query: "{query}"

Documents:
{docs_json}

For EACH document, extract:
1. title: One catchy headline (max 10 words)
2. description: Brief 1-sentence summary
3. data_points: 2-4 specific numbers/metrics found (label, value, unit, trend)
4. key_quote: The most important sentence from the document
5. highlights: 2-3 key phrases/snippets that directly answer the query (mark important words with **bold**)
6. snippet: A 1-2 sentence excerpt that best represents the document's value
7. non_technical_insight: Plain English explanation a non-expert would understand
8. actionable_takeaway: What someone should do with this information
9. confidence: 0.0-1.0 how relevant/reliable this is

Return JSON:
{{
    "documents": [
        {{
            "id": 0,
            "title": "...",
            "description": "...",
            "data_points": [{{"label": "Revenue", "value": "10B", "unit": "USD", "trend": "up"}}],
            "key_quote": "...",
            "highlights": ["**Q3 revenue** grew 15% YoY", "Operating margin improved to **22%**"],
            "snippet": "...",
            "non_technical_insight": "...",
            "actionable_takeaway": "...",
            "confidence": 0.85
        }}
    ]
}}"""

        response = model.generate_content(prompt, generation_config=genai.GenerationConfig(
            temperature=0.3, max_output_tokens=3000
        ))
        
        # Check if response was blocked or empty
        if not response.candidates or not response.candidates[0].content.parts:
            logger.warning(f"Document insight extraction: Response blocked or empty")
            return [{
                "title": f"Result {i+1}",
                "description": doc.get("text", "")[:100],
                "relevance_score": doc.get("score", 0),
                "data_points": [],
                "key_quote": "",
                "highlights": [],
                "snippet": doc.get("text", "")[:200] + "...",
                "non_technical_insight": "",
                "actionable_takeaway": "",
                "source_url": doc.get("url", ""),
                "source_code": doc.get("code", ""),
                "confidence": 0.5,
                "full_text": doc.get("text", "")
            } for i, doc in enumerate(documents)]
        
        result = extract_json(response.text)
        if not result:
            logger.warning(f"Document insight extraction: Could not parse JSON")
            return [{
                "title": f"Result {i+1}",
                "description": doc.get("text", "")[:100],
                "relevance_score": doc.get("score", 0),
                "data_points": [],
                "key_quote": "",
                "highlights": [],
                "snippet": doc.get("text", "")[:200] + "...",
                "non_technical_insight": "",
                "actionable_takeaway": "",
                "source_url": doc.get("url", ""),
                "source_code": doc.get("code", ""),
                "confidence": 0.5,
                "full_text": doc.get("text", "")
            } for i, doc in enumerate(documents)]
        
        analysis_map = {d["id"]: d for d in result.get("documents", [])}
        
        enhanced_docs = []
        for i, doc in enumerate(documents):
            if i in analysis_map:
                analysis = analysis_map[i]
                enhanced_docs.append({
                    "title": analysis.get("title", "Untitled"),
                    "description": analysis.get("description", ""),
                    "relevance_score": doc.get("score", 0),
                    "data_points": analysis.get("data_points", []),
                    "key_quote": analysis.get("key_quote", ""),
                    "highlights": analysis.get("highlights", []),
                    "snippet": analysis.get("snippet", ""),
                    "non_technical_insight": analysis.get("non_technical_insight", ""),
                    "actionable_takeaway": analysis.get("actionable_takeaway", ""),
                    "source_url": doc.get("url", ""),
                    "source_code": doc.get("code", ""),
                    "confidence": analysis.get("confidence", 0.5),
                    "full_text": doc.get("text", "")
                })
            else:
                enhanced_docs.append({
                    "title": f"Document {i+1}",
                    "description": doc.get("text", "")[:100] + "...",
                    "relevance_score": doc.get("score", 0),
                    "data_points": [],
                    "key_quote": "",
                    "highlights": [],
                    "snippet": doc.get("text", "")[:200] + "...",
                    "non_technical_insight": "",
                    "actionable_takeaway": "",
                    "source_url": doc.get("url", ""),
                    "source_code": doc.get("code", ""),
                    "confidence": 0.5,
                    "full_text": doc.get("text", "")
                })
        
        return enhanced_docs
    except Exception as e:
        logger.error(f"Document insight extraction error: {e}")
        return [{
            "title": f"Result {i+1}",
            "description": doc.get("text", "")[:100],
            "relevance_score": doc.get("score", 0),
            "data_points": [],
            "key_quote": "",
            "highlights": [],
            "snippet": doc.get("text", "")[:200] + "...",
            "non_technical_insight": "",
            "actionable_takeaway": "",
            "source_url": doc.get("url", ""),
            "source_code": doc.get("code", ""),
            "confidence": 0.5,
            "full_text": doc.get("text", "")
        } for i, doc in enumerate(documents)]


def generate_executive_summary(query: str, documents: List[Dict]) -> Dict[str, Any]:
    """
    Generate executive summary with key metrics, insights, risks, and opportunities
    """
    if not GOOGLE_API_KEY or not documents:
        return {
            "executive_summary": "Search completed.",
            "key_metrics": [],
            "main_insight": "",
            "risk_factors": [],
            "opportunities": []
        }
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        combined_text = "\n\n".join([
            f"[Doc {i+1}]: {doc.get('text', '')[:500]}"
            for i, doc in enumerate(documents[:5])
        ])
        
        prompt = f"""Based on these financial documents, create an executive summary for the query.

Query: "{query}"

Documents:
{combined_text}

Generate:
1. executive_summary: 2-3 sentence overview a busy executive can read in 10 seconds
2. key_metrics: 3-5 important numbers/metrics found (label, value, unit, trend)
3. main_insight: The #1 takeaway in one sentence
4. risk_factors: 2-3 risks or concerns mentioned
5. opportunities: 2-3 opportunities or positive factors

Return JSON:
{{
    "executive_summary": "...",
    "key_metrics": [{{"label": "...", "value": "...", "unit": "...", "trend": "up|down|stable"}}],
    "main_insight": "...",
    "risk_factors": ["risk 1", "risk 2"],
    "opportunities": ["opportunity 1", "opportunity 2"]
}}"""

        response = model.generate_content(prompt, generation_config=genai.GenerationConfig(
            temperature=0.3, max_output_tokens=1000
        ))
        
        # Check if response was blocked or empty
        if not response.candidates or not response.candidates[0].content.parts:
            logger.warning(f"Executive summary: Response blocked or empty")
            return {
                "executive_summary": "Analysis complete. Review documents for details.",
                "key_metrics": [],
                "main_insight": "",
                "risk_factors": [],
                "opportunities": []
            }
        
        result = extract_json(response.text)
        if not result:
            logger.warning(f"Executive summary: Could not parse JSON")
            return {
                "executive_summary": "Analysis complete. Review documents for details.",
                "key_metrics": [],
                "main_insight": "",
                "risk_factors": [],
                "opportunities": []
            }
            
        return result
    except Exception as e:
        logger.error(f"Executive summary error: {e}")
        return {
            "executive_summary": "Analysis complete. Review documents for details.",
            "key_metrics": [],
            "main_insight": "",
            "risk_factors": [],
            "opportunities": []
        }


# ----------------- Search Engine -----------------


class RAGSearchEngine:
    """RAG Search Engine using Qdrant for hybrid search"""
    
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if RAGSearchEngine._initialized:
            return
        
        logger.info("🔌 Initializing RAG Search Engine (Qdrant)...")
        self.client = None
        self.initialized = False
        self.collection_name = os.environ.get("QDRANT_COLLECTION", "stocks")
        self.embedding_url = os.environ.get("EMBEDDING_URL")
        self.sparse_url = os.environ.get("SPARSE_URL")
        self.qdrant_url = os.environ.get("QDRANT_URL")
        self.qdrant_api_key = os.environ.get("QDRANT_API_KEY")

    def _lazy_init(self):
        if self.initialized:
            return True

        try:
            if not self.qdrant_url:
                logger.error("❌ QDRANT_URL not set")
                return False
                
            self.client = QdrantClient(
                url=self.qdrant_url,
                api_key=self.qdrant_api_key,
                timeout=30
            )
            
            self.initialized = True
            RAGSearchEngine._initialized = True
            logger.info(f"🚀 Qdrant Engine Ready. Collection: {self.collection_name}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize Qdrant: {e}")
            return False

    def get_dense_embedding(self, text: str) -> Optional[List[float]]:
        if not self.embedding_url:
            logger.warning("⚠️ EMBEDDING_URL not configured")
            return None
        try:
            url = self.embedding_url
            if not url.endswith("/embeddings"):
                url = f"{url.rstrip('/')}/embeddings"
                
            payload = {
                "input": [text],
                "model": EMBEDDING_MODEL
            }
            headers = {"Content-Type": "application/json"}
            logger.debug(f"Dense embedding request to {url}")
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            result = response.json()
            return result["data"][0]["embedding"]
        except requests.exceptions.Timeout:
            logger.error(f"❌ Dense embedding timeout for {self.embedding_url}")
            return None
        except requests.exceptions.ConnectionError as e:
            logger.error(f"❌ Dense embedding connection error: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Dense embedding error: {e}")
            return None

    def get_sparse_embedding(self, text: str) -> Optional[Any]:
        """Returns sparse embedding - can be dict with indices/values or list"""
        if not self.sparse_url:
            logger.info("ℹ️ SPARSE_URL not configured, skipping sparse search")
            return None
        try:
            payload = {"input": [text]}
            headers = {"Content-Type": "application/json"}
            logger.debug(f"Sparse embedding request to {self.sparse_url}")
            response = requests.post(self.sparse_url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            result = response.json()
            embedding = result["data"][0]["embedding"]
            
            # Check if it's sparse format (dict with indices/values)
            if isinstance(embedding, dict) and "indices" in embedding and "values" in embedding:
                logger.debug(f"Received sparse vector with {len(embedding['indices'])} non-zero elements")
                return models.SparseVector(
                    indices=embedding["indices"],
                    values=embedding["values"]
                )
            # Otherwise it's a dense list
            logger.debug(f"Received dense-like sparse vector with {len(embedding)} dimensions")
            return embedding
        except requests.exceptions.Timeout:
            logger.warning(f"⚠️ Sparse embedding timeout for {self.sparse_url} - continuing with dense only")
            return None
        except requests.exceptions.ConnectionError as e:
            logger.warning(f"⚠️ Sparse embedding connection failed: {e} - continuing with dense only")
            return None
        except Exception as e:
            logger.error(f"❌ Sparse embedding error: {e}")
            return None

    def search(self, query: str, top_k: int = TOP_K) -> List[Dict]:
        if not self._lazy_init():
            return []

        dense_vec = self.get_dense_embedding(query)
        sparse_vec = self.get_sparse_embedding(query)
        
        if not dense_vec:
            logger.warning("⚠️ Could not generate dense embedding")
            return []

        limit = top_k * 3  # Fetch more for deduplication
        
        try:
            prefetch = []
            if sparse_vec:
                # If sparse_vec is already a SparseVector model, use it directly
                if isinstance(sparse_vec, models.SparseVector):
                    prefetch.append(models.Prefetch(
                        query=sparse_vec,
                        using="sparse",
                        limit=limit * 2
                    ))
                else:
                    # Otherwise wrap it as a regular vector
                    prefetch.append(models.Prefetch(
                        query=sparse_vec,
                        using="sparse",
                        limit=limit * 2
                    ))
            
            results = self.client.query_points(
                collection_name=self.collection_name,
                prefetch=prefetch if prefetch else None,
                query=dense_vec,
                using="dense",
                limit=limit,
                with_payload=True
            ).points
            
            seen_hashes = set()
            unique_results = []
            
            for hit in results:
                payload = hit.payload or {}
                file_hash = payload.get("file_hash")
                
                unique_key = file_hash or payload.get("pdf_url") or payload.get("text_filename")
                
                if unique_key and unique_key in seen_hashes:
                    continue
                
                if unique_key:
                    seen_hashes.add(unique_key)
                
                text_content = payload.get("text", "")
                if not text_content:
                    text_content = f"{payload.get('stock_name', '')} - {payload.get('subject', '')}\nCategory: {payload.get('category', '')}"
                
                unique_results.append({
                    "score": hit.score,
                    "code": str(payload.get("stock_code", "")),
                    "url": payload.get("pdf_url", ""),
                    "text": text_content,
                    "title": payload.get("subject", ""),
                    "metadata": payload
                })
                
                if len(unique_results) >= top_k:
                    break
            
            return unique_results

        except Exception as e:
            logger.error(f"❌ Qdrant search error: {e}")
            return []
    
    def multi_query_search(self, queries: List[str], top_k: int = TOP_K) -> List[Dict]:
        """Search with multiple queries and merge results"""
        if not self._lazy_init():
            return []
        
        all_results = {}
        
        for query in queries:
            results = self.search(query, top_k)
            for r in results:
                key = r.get("url") or r.get("title")
                if key in all_results:
                    all_results[key]["score"] = max(all_results[key]["score"], r["score"]) * 1.1
                else:
                    all_results[key] = r
        
        sorted_results = sorted(all_results.values(), key=lambda x: x["score"], reverse=True)
        return sorted_results[:top_k]


search_engine = RAGSearchEngine()


# ----------------- Streaming Endpoint -----------------


@agentic_rag_bp.route("/agentic-rag/stream", methods=["POST"])
def agentic_rag_stream():
    """Streaming endpoint with real-time steps"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400
        
        try:
            req = AgenticRequest(**data)
        except Exception as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        
        def generate():
            start_time = time.time()
            
            def send_step(step_type: str, title: str, description: str, data: Dict = None):
                step = {
                    "type": "step",
                    "step": {
                        "step_type": step_type,
                        "title": title,
                        "description": description,
                        "data": data or {},
                        "timestamp_ms": (time.time() - start_time) * 1000
                    }
                }
                return f"data: {json.dumps(step)}\n\n"
            
            # Step 1: Direct Retrieval
            yield send_step("retrieval", "Searching Documents", "Retrieving relevant documents")
            
            documents = search_engine.search(req.query, req.top_k)
            
            yield send_step("retrieval_done", f"Found {len(documents)} Documents",
                          f"Best match: {documents[0]['score']:.0%}" if documents else "No results")
            
            # Step 2: Extract Insights
            yield send_step("insight_extraction", "Analyzing Documents", "Extracting insights and data points")
            enriched_documents = extract_document_insights(req.query, documents)
            
            yield send_step("insight_extraction_done", "Insights Ready",
                          f"{sum(len(d.get('data_points', [])) for d in enriched_documents)} data points found")
            
            # Step 3: Executive Summary
            yield send_step("summarization", "Generating Summary", "Creating executive overview")
            summary = generate_executive_summary(req.query, documents)
            
            yield send_step("complete", "Analysis Complete", "All insights ready")
            
            # Final Result
            total_time = (time.time() - start_time) * 1000
            
            final_result = {
                "type": "result",
                "data": {
                    "original_query": req.query,
                    "interpreted_intent": req.query,
                    "expanded_queries": [],
                    "sub_questions": [],
                    "step_back_question": "",
                    
                    "executive_summary": summary.get("executive_summary", ""),
                    "key_metrics": summary.get("key_metrics", []),
                    "main_insight": summary.get("main_insight", ""),
                    "risk_factors": summary.get("risk_factors", []),
                    "opportunities": summary.get("opportunities", []),
                    
                    "documents": enriched_documents,
                    
                    "total_time_ms": round(total_time, 2),
                    "num_iterations": 1,
                    "confidence_score": np.mean([d.get("confidence", 0.5) for d in enriched_documents]) if enriched_documents else 0
                }
            }
            yield f"data: {json.dumps(final_result)}\n\n"
        
        return Response(generate(), mimetype="text/event-stream")
    
    except Exception as e:
        import traceback
        logger.error(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@agentic_rag_bp.route("/agentic-rag", methods=["POST"])
def agentic_rag_route():
    """Non-streaming endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400
        
        try:
            req = AgenticRequest(**data)
        except Exception as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        
        start_time = time.time()
        steps = []
        
        # Run pipeline
        documents = search_engine.search(req.query, req.top_k)
        enriched_documents = extract_document_insights(req.query, documents)
        summary = generate_executive_summary(req.query, documents)
        
        total_time = (time.time() - start_time) * 1000
        
        return jsonify({
            "original_query": req.query,
            "interpreted_intent": req.query,
            "expanded_queries": [],
            "sub_questions": [],
            "step_back_question": "",
            
            "executive_summary": summary.get("executive_summary", ""),
            "key_metrics": summary.get("key_metrics", []),
            "main_insight": summary.get("main_insight", ""),
            "risk_factors": summary.get("risk_factors", []),
            "opportunities": summary.get("opportunities", []),
            
            "documents": enriched_documents,
            
            "total_time_ms": round(total_time, 2),
            "num_iterations": 1,
            "confidence_score": np.mean([d.get("confidence", 0.5) for d in enriched_documents]) if enriched_documents else 0,
            "agent_steps": steps
        })
    
    except Exception as e:
        import traceback
        logger.error(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@agentic_rag_bp.route("/agentic-rag/health", methods=["GET"])
def agentic_health():
    return jsonify({
        "status": "ok",
        "embedding_url": EMBEDDING_URL,
        "embedding_model": EMBEDDING_MODEL,
        "gemini_configured": bool(GOOGLE_API_KEY),
        "engine_initialized": search_engine.initialized,
        "features": ["hybrid_search", "insight_extraction", "summarization"]
    })
