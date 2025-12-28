# BSE WhatsApp Alert System - Query-Based Architecture

## Overview

This system uses **semantic embeddings** and **vector similarity search** to match BSE announcements with user queries in real-time. When a user subscribes with a natural language query, we embed it and store it in Qdrant. When new announcements arrive, we check for matches above a 75% similarity threshold and send WhatsApp alerts only to relevant users.

## Architecture

```
┌─────────────────┐
│  BSE API        │
│  (Announcements)│
└────────┬────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  Python Monitor (monitor_qdrant.py)            │
│  • Polls BSE API every 2 minutes               │
│  • Downloads & extracts PDF text               │
│  • Generates dense (vLLM) + sparse (SPLADE)    │
│  • Stores in Qdrant (bse_announcements)        │
│  • Finds matching users (>75% similarity)      │
└────────┬───────────────────────────────────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  Next.js API (/api/alerts/send)                │
│  • Receives matched announcement + users       │
│  • Sends WhatsApp messages via baileys server  │
└────────┬───────────────────────────────────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  WhatsApp (Baileys Server)                     │
│  • Sends formatted alerts to users             │
└────────────────────────────────────────────────┘
```

### User Subscription Flow

```
┌────────────────┐
│  User creates  │
│  alert query   │
└────────┬───────┘
         │
         v
┌────────────────────────────────────────────────┐
│  Next.js Frontend (/api/broadcasts/subscribe)  │
│  • Validates query                             │
│  • Generates embeddings (vLLM + SPLADE)        │
│  • Stores in MongoDB + Qdrant                  │
└────────────────────────────────────────────────┘

User query embedding stored in:
  - MongoDB: user preferences, phone number
  - Qdrant: dense + sparse vectors in "user_embeddings"
```

## Components

### 1. Frontend (Next.js)

**Key Files:**

-   `apps/frontend/src/app/(dashboard)/alerts/page.tsx` - User configuration UI
-   `apps/frontend/src/lib/alerts/embeddings.ts` - Embedding utilities
-   `apps/frontend/src/lib/alerts/qdrant.ts` - Qdrant client
-   `apps/frontend/src/lib/alerts/stock-data.ts` - Stock baskets & autocomplete
-   `apps/frontend/src/app/api/broadcasts/subscribe/route.ts` - Subscription endpoint
-   `apps/frontend/src/app/api/alerts/send/route.ts` - Receives from Python

**Features:**

-   Natural language query input
-   Stock autocomplete with popular scrips
-   Stock basket selection (SENSEX, BANKEX, etc.)
-   Real-time subscription management

### 2. Python Monitor

**Key Files:**

-   `apps/announcements-server-py/monitor_qdrant.py` - Main monitor loop
-   `apps/announcements-server-py/qdrant_storage.py` - Qdrant operations
-   `apps/announcements-server-py/whatsapp.py` - WhatsApp client (legacy)

**Flow:**

1. Poll BSE API every 2 minutes
2. Download PDF and extract text
3. Generate dense (vLLM) + sparse (SPLADE) embeddings
4. Store announcement in `bse_announcements` collection
5. Search for matching users in `user_embeddings` collection
6. Send notification to Next.js with matched users

### 3. Qdrant Collections

#### `bse_announcements`

Stores all announcements with hybrid vectors.

**Schema:**

```python
{
  "id": "deterministic-uuid-from-file-hash",
  "vector": {
    "dense": [4096 floats],  # e5-mistral-7b-instruct
    "sparse": {
      "indices": [...],      # SPLADE tokens
      "values": [...]
    }
  },
  "payload": {
    "text": "announcement content",
    "stock_code": "500325",
    "stock_name": "Reliance Industries",
    "category": "Quarterly Results",
    "subject": "...",
    "date_time": "...",
    "pdf_url": "...",
    "file_hash": "sha256"
  }
}
```

#### `user_embeddings`

Stores user queries with hybrid vectors.

**Schema:**

```python
{
  "id": "md5-hash-of-userId",
  "vector": {
    "dense": [4096 floats],
    "sparse": {
      "indices": [...],
      "values": [...]
    }
  },
  "payload": {
    "userId": "clerk-user-id",
    "phoneNumber": "919876543210",
    "query": "Dividend announcements for banks",
    "scrips": ["500180", "500247"],
    "baskets": ["sensex", "bankex"]
  }
}
```

## Embedding Models

### Dense: `intfloat/e5-mistral-7b-instruct`

-   Served via **vLLM** at `VLLM_EMBEDDING_URL`
-   4096 dimensions
-   Cosine similarity for semantic matching

### Sparse: `prithivida/Splade_PP_en_v1`

-   Served via **FastAPI** at `SPLADE_EMBEDDING_URL`
-   Keyword-based matching (BM25-like)
-   Complements dense embeddings

## Setup

### 1. Install Python Dependencies

```bash
cd monorepo/apps/announcements-server-py
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and set:

```bash
QDRANT_URL="your-qdrant-cloud-url"
QDRANT_API_KEY="your-api-key"
VLLM_EMBEDDING_URL="http://ip:8000/v1/embeddings"
SPLADE_EMBEDDING_URL="http://ip:8003/v1/embeddings"
NEXTJS_NOTIFY_URL="http://localhost:3000/api/alerts/send"
```

### 3. Run the Monitor

```bash
python monitor_qdrant.py
```

### 4. Run the Frontend

```bash
cd monorepo/apps/frontend
pnpm dev
```

## Environment Variables

### Frontend (apps/frontend/.env)

```bash
VLLM_EMBEDDING_URL="http://134.199.204.253:8000/v1/embeddings"
SPLADE_EMBEDDING_URL="http://134.199.204.253:8003/v1/embeddings"
QDRANT_URL="https://your-cluster.qdrant.io"
QDRANT_API_KEY="your-api-key"
MONGODB_URI="mongodb+srv://..."
CLERK_SECRET_KEY="sk_test_..."
WHATSAPP_SERVER_URL="http://localhost:4001"
```

### Python (apps/announcements-server-py/.env)

```bash
QDRANT_URL="https://your-cluster.qdrant.io"
QDRANT_API_KEY="your-api-key"
VLLM_EMBEDDING_URL="http://134.199.204.253:8000/v1/embeddings"
SPLADE_EMBEDDING_URL="http://134.199.204.253:8003/v1/embeddings"
NEXTJS_NOTIFY_URL="http://localhost:3000/api/alerts/send"
WHATSAPP_SERVER_URL="http://localhost:4001"
```

## User Flow Example

1. **User subscribes:**

    ```
    Query: "Dividend announcements for banks"
    Scrips: ["500180", "500247"]
    Baskets: ["bankex"]
    Phone: "919876543210"
    ```

2. **System embeds and stores:**

    - Embeddings generated via vLLM + SPLADE
    - Stored in MongoDB (metadata) + Qdrant (vectors)

3. **New announcement arrives:**

    ```
    Title: "HDFC Bank declares interim dividend"
    Stock: 500180
    Category: Corporate Actions
    ```

4. **Python monitor:**

    - Stores announcement in Qdrant
    - Searches user_embeddings with 75% threshold
    - Finds matching user (score: 0.87)
    - Sends to Next.js API

5. **Next.js sends WhatsApp:**
    - Formats message
    - Calls WhatsApp server
    - User receives alert

## Key Features

✅ **Natural language queries** - No complex filters
✅ **Semantic matching** - Understands context, not just keywords
✅ **Hybrid search** - Dense + sparse embeddings
✅ **Real-time** - 2-minute polling interval
✅ **Scalable** - Vector DB handles millions of points
✅ **Persistent** - Embeddings stored, no recomputation
✅ **Threshold control** - 75% similarity prevents spam

## Troubleshooting

### "SPLADE embedding failed"

-   Check `SPLADE_EMBEDDING_URL` is accessible
-   Ensure SPLADE server is running (see below)
-   Fallback to local fastembed if configured

### "No matching users"

-   Check if users have subscribed
-   Verify `user_embeddings` collection exists
-   Lower threshold in `qdrant_storage.py` for testing

### "WhatsApp not sending"

-   Verify WhatsApp server is running (port 4001)
-   Check phone number format (no + symbol)
-   Ensure baileys is authenticated

## SPLADE Server

If you need to run your own SPLADE server:

```python
from fastapi import FastAPI
from fastembed import SparseTextEmbedding
import uvicorn

app = FastAPI()
model = SparseTextEmbedding("prithivida/Splade_PP_en_v1")

@app.post("/v1/embeddings")
def embed(req: dict):
    embeddings = list(model.embed(req["input"]))
    data = []
    for i, emb in enumerate(embeddings):
        data.append({
            "index": i,
            "embedding": {
                "indices": emb.indices.tolist(),
                "values": emb.values.tolist(),
            }
        })
    return {"object": "list", "data": data, "model": "Splade_PP_en_v1"}

uvicorn.run(app, host="0.0.0.0", port=8003)
```

## Performance

-   **Embedding generation**: ~1-2s per query (vLLM + SPLADE)
-   **Qdrant search**: <100ms for 1M points
-   **End-to-end latency**: ~5-10s from announcement to WhatsApp

## Future Enhancements

-   [ ] Add chunking for long announcements
-   [ ] Implement dense + sparse fusion scoring
-   [ ] Add user feedback loop (thumbs up/down)
-   [ ] Real-time websockets instead of polling
-   [ ] Multi-language support
-   [ ] Rich WhatsApp formatting with buttons

