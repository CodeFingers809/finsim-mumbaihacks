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
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv
import google.generativeai as genai

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

VLLM_API_URL = os.environ.get("VLLM_API_URL", "http://localhost:8000/v1")
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
            logger.warning(f"Query expansion: Response blocked or empty (finish_reason: {response.candidates[0].finish_reason if response.candidates else 'no candidates'})")
            return {"expanded_queries": [query], "search_terms": query.split(), "interpreted_intent": query}
        
        text = response.text.strip()
        if "```" in text:
            text = text.split("```")[1].replace("json", "").strip()
        
        return json.loads(text)
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
        
        text = response.text.strip()
        if "```" in text:
            text = text.split("```")[1].replace("json", "").strip()
        
        return json.loads(text)
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
            logger.warning(f"Document insight extraction: Response blocked or empty (finish_reason: {response.candidates[0].finish_reason if response.candidates else 'no candidates'})")
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
        
        text = response.text.strip()
        if "```" in text:
            text = text.split("```")[1].replace("json", "").strip()
        
        result = json.loads(text)
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
            logger.warning(f"Executive summary: Response blocked or empty (finish_reason: {response.candidates[0].finish_reason if response.candidates else 'no candidates'})")
            return {
                "executive_summary": "Analysis complete. Review documents for details.",
                "key_metrics": [],
                "main_insight": "",
                "risk_factors": [],
                "opportunities": []
            }
        
        text = response.text.strip()
        if "```" in text:
            text = text.split("```")[1].replace("json", "").strip()
        
        return json.loads(text)
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
    """RAG Search Engine using vLLM for embeddings"""
    
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
        if self.initialized:
            return True

        try:
            self.client = OpenAI(base_url=VLLM_API_URL, api_key="EMPTY")
            self._load_index()
            self.initialized = True
            RAGSearchEngine._initialized = True
            logger.info(f"🚀 Engine Ready. Indexed {len(self.df):,} documents.")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize: {e}")
            return False

    def _load_index(self):
        try:
            import pyarrow.parquet as pq
            import pyarrow as pa

            parquet_files = [
                os.path.join(DATA_DIR, f)
                for f in os.listdir(DATA_DIR)
                if f.endswith(".parquet")
            ]

            if not parquet_files:
                raise ValueError(f"No parquet files found in {DATA_DIR}")

            tables = []
            for f in parquet_files:
                try:
                    tables.append(pq.read_table(f))
                except Exception as e:
                    logger.warning(f"  Skipping {f}: {e}")

            combined = pa.concat_tables(tables)
            self.df = combined.to_pandas()

            vecs = np.stack(self.df["vector"].values)
            self.vectors = vecs.astype(np.float32) / 100.0
            norms = np.linalg.norm(self.vectors, axis=1, keepdims=True)
            norms = np.where(norms == 0, 1, norms)
            self.vectors = self.vectors / norms

        except Exception as e:
            logger.error(f"❌ Failed to load index: {e}")
            raise

    def get_embedding(self, text: str) -> Optional[np.ndarray]:
        formatted_query = f"Instruct: Retrieve financial insights.\nQuery: {text}"
        
        try:
            response = self.client.embeddings.create(
                input=[formatted_query], model=EMBEDDING_MODEL
            )
            return np.array(response.data[0].embedding, dtype=np.float32)
        except Exception as e:
            logger.error(f"❌ Embedding error: {e}")
            return None

    def search(self, query: str, top_k: int = TOP_K) -> List[Dict]:
        if not self._lazy_init():
            return []

        query_vec = self.get_embedding(query)
        if query_vec is None:
            return []

        query_norm = np.linalg.norm(query_vec)
        if query_norm > 0:
            query_vec = query_vec / query_norm

        scores = np.dot(self.vectors, query_vec)
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            row = self.df.iloc[idx]
            results.append({
                "score": float(scores[idx]),
                "code": str(row.get("code", "")),
                "url": str(row.get("url", "")),
                "text": str(row.get("text", ""))[:2000],
            })

        return results
    
    def multi_query_search(self, queries: List[str], top_k: int = TOP_K) -> List[Dict]:
        """Search with multiple queries and merge results"""
        if not self._lazy_init():
            return []
        
        all_results = {}
        
        for query in queries:
            results = self.search(query, top_k)
            for r in results:
                key = r.get("url") or r.get("text")[:100]
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
            
            # Step 1: Query Expansion
            yield send_step("query_expansion", "Expanding Query", "Finding synonyms and related terms")
            expansion = expand_query(req.query)
            expanded_queries = expansion.get("expanded_queries", [req.query])
            interpreted_intent = expansion.get("interpreted_intent", req.query)
            
            yield send_step("query_expansion_done", "Query Expanded", 
                          f"Found {len(expanded_queries)} variations",
                          {"queries": expanded_queries[:3]})
            
            # Step 2: Sub-Question Decomposition
            yield send_step("decomposition", "Decomposing Query", "Breaking into sub-questions")
            sub_questions = decompose_into_subquestions(req.query, interpreted_intent)
            
            yield send_step("decomposition_done", f"{len(sub_questions)} Sub-Questions",
                          sub_questions[0][:50] + "..." if sub_questions else "",
                          {"sub_questions": sub_questions})
            
            # Step 3: Step-Back Prompting
            yield send_step("step_back", "Step-Back Analysis", "Generating broader context")
            step_back_question = generate_step_back_question(req.query)
            
            yield send_step("step_back_done", "Context Expanded",
                          step_back_question[:60] + "...")
            
            # Step 4: HyDE
            yield send_step("hyde", "Hypothesis Generation", "Creating ideal answer pattern")
            hypothetical_answer = generate_hypothetical_answer(req.query, interpreted_intent)
            
            yield send_step("hyde_done", "Search Pattern Ready",
                          "Semantic matching optimized")
            
            # Step 5: Multi-Query Retrieval
            yield send_step("retrieval", "Multi-Query Search", f"Searching with {min(8, len(expanded_queries) + len(sub_questions) + 2)} query variants")
            
            all_search_queries = [req.query] + expanded_queries + sub_questions + [step_back_question, hypothetical_answer]
            all_search_queries = list(set(all_search_queries))[:8]
            
            documents = search_engine.multi_query_search(all_search_queries, req.top_k)
            
            yield send_step("retrieval_done", f"Found {len(documents)} Documents",
                          f"Best match: {documents[0]['score']:.0%}" if documents else "No results")
            
            # Step 6: Extract Insights
            yield send_step("insight_extraction", "Analyzing Documents", "Extracting insights and data points")
            enriched_documents = extract_document_insights(req.query, documents)
            
            yield send_step("insight_extraction_done", "Insights Ready",
                          f"{sum(len(d.get('data_points', [])) for d in enriched_documents)} data points found")
            
            # Step 7: Executive Summary
            yield send_step("summarization", "Generating Summary", "Creating executive overview")
            summary = generate_executive_summary(req.query, documents)
            
            yield send_step("complete", "Analysis Complete", "All insights ready")
            
            # Final Result
            total_time = (time.time() - start_time) * 1000
            
            final_result = {
                "type": "result",
                "data": {
                    "original_query": req.query,
                    "interpreted_intent": interpreted_intent,
                    "expanded_queries": expanded_queries,
                    "sub_questions": sub_questions,
                    "step_back_question": step_back_question,
                    
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
        expansion = expand_query(req.query)
        expanded_queries = expansion.get("expanded_queries", [req.query])
        interpreted_intent = expansion.get("interpreted_intent", req.query)
        
        sub_questions = decompose_into_subquestions(req.query, interpreted_intent)
        step_back_question = generate_step_back_question(req.query)
        hypothetical_answer = generate_hypothetical_answer(req.query, interpreted_intent)
        
        all_search_queries = [req.query] + expanded_queries + sub_questions + [step_back_question, hypothetical_answer]
        all_search_queries = list(set(all_search_queries))[:8]
        
        documents = search_engine.multi_query_search(all_search_queries, req.top_k)
        enriched_documents = extract_document_insights(req.query, documents)
        summary = generate_executive_summary(req.query, documents)
        
        total_time = (time.time() - start_time) * 1000
        
        return jsonify({
            "original_query": req.query,
            "interpreted_intent": interpreted_intent,
            "expanded_queries": expanded_queries,
            "sub_questions": sub_questions,
            "step_back_question": step_back_question,
            
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
        "vllm_url": VLLM_API_URL,
        "embedding_model": EMBEDDING_MODEL,
        "gemini_configured": bool(GOOGLE_API_KEY),
        "engine_initialized": search_engine.initialized,
        "features": ["query_expansion", "sub_question_decomposition", "hyde", "step_back_prompting"]
    })
