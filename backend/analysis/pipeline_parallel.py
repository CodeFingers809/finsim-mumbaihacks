import os
import sys
import time
import asyncio
import sqlite3
import logging
import aiohttp
import random
import numpy as np
import polars as pl
import fitz  # Requires: pip install pymupdf
from datetime import datetime
from tqdm import tqdm
from aiohttp import ClientTimeout, TCPConnector
from openai import AsyncOpenAI, BadRequestError
from concurrent.futures import ProcessPoolExecutor

# ================= CONFIGURATION =================
# GENERATE LIST OF 8 ENDPOINTS (Ports 8000 to 8007)
VLLM_NODES = [f"http://localhost:{8000+i}/v1" for i in range(8)]

DATA_DIR = "./data_lake"
DB_PATH = "pipeline_state.db"
PRIORITY_CSV = "priority_queue.csv"
LOG_FILE = "batch_history.log"

# SETTINGS
BATCH_SIZE = 50                
MAX_CONCURRENT_DOWNLOADS = 16  
NUM_CPU_WORKERS = 8            
DOWNLOAD_TIMEOUT = 120         
TOTAL_DOCS = 36478

# SAFETY LIMIT: 
# Mistral Limit: 8192 tokens. 
# Safe Character Limit: ~25,000 chars (approx 6000-7000 tokens)
# This leaves room for the instruction prompt overhead.
MAX_CHARS = 10000 

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15"
]

logging.basicConfig(level=logging.FATAL)

def log_to_file(msg):
    with open(LOG_FILE, "a") as f:
        f.write(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}\n")

def init_db():
    conn = sqlite3.connect(DB_PATH, timeout=60)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;") 
    conn.execute('''CREATE TABLE IF NOT EXISTS job_queue (
                    id INTEGER PRIMARY KEY, url TEXT, stock_code TEXT,
                    status TEXT DEFAULT 'PENDING', 
                    batch_id INTEGER, error_log TEXT)''')
    conn.execute("CREATE INDEX IF NOT EXISTS idx_status ON job_queue(status)")
    # Reset stuck jobs
    conn.execute("UPDATE job_queue SET status='PENDING' WHERE status='PROCESSING'")
    conn.commit()
    return conn

def hydrate_queue():
    if not os.path.exists(PRIORITY_CSV): return
    conn = sqlite3.connect(DB_PATH, timeout=60)
    
    # Only load if DB is empty
    try:
        count = conn.execute("SELECT count(*) FROM job_queue").fetchone()[0]
        if count == 0:
            print("🚀 Hydrating Queue from CSV...")
            df = pl.read_csv(PRIORITY_CSV)
            rows = [(i, row["PDF_URL"], str(row["Stock_Code"])) 
                    for i, row in enumerate(df.iter_rows(named=True))]
            conn.executemany("INSERT INTO job_queue (id, url, stock_code) VALUES (?, ?, ?)", rows)
            conn.commit()
            print(f"✅ Loaded {len(rows)} jobs.")
    except Exception as e:
        print(f"DB Error during hydration: {e}")
    finally:
        conn.close()

# ================= WORKERS =================
def parse_pdf_bytes(args):
    job_id, content, stock_code, url = args
    try:
        with fitz.open(stream=content, filetype="pdf") as doc:
            text = "\n".join([page.get_text() for page in doc])
        
        if not text or len(text.strip()) < 50:
            return {"status": "SKIPPED_EMPTY", "id": job_id, "err": "Empty"}

        # --- CRITICAL FIX: TRUNCATE TEXT ---
        # We enforce a hard character limit to stay within 8192 tokens
        if len(text) > MAX_CHARS:
            text = text[:MAX_CHARS]
            
        return {"status": "SUCCESS", "id": job_id, "url": url, "code": stock_code, "text": text}
    except Exception as e:
        return {"status": "FAILED", "id": job_id, "err": str(e)[:50]}

async def downloader(queue, buffer, cpu_pool):
    timeout = ClientTimeout(total=DOWNLOAD_TIMEOUT)
    conn = TCPConnector(limit=0, ttl_dns_cache=300)
    loop = asyncio.get_running_loop()
    
    async with aiohttp.ClientSession(connector=conn, timeout=timeout) as session:
        while True:
            item = await queue.get()
            if item is None: 
                queue.task_done()
                break
            
            job_id, url, code = item
            
            success = False
            for attempt in range(3):
                try:
                    await asyncio.sleep(random.uniform(1.0, 3.0)) 
                    headers = {"User-Agent": random.choice(USER_AGENTS)}
                    async with session.get(url, headers=headers) as resp:
                        if resp.status == 200:
                            content = await resp.read()
                            result = await loop.run_in_executor(cpu_pool, parse_pdf_bytes, (job_id, content, code, url))
                            await buffer.put(result)
                            success = True
                            break
                        elif resp.status in [403, 429]:
                            await asyncio.sleep(30)
                        else:
                            await asyncio.sleep(2)
                except Exception:
                    await asyncio.sleep(1)
            
            if not success:
                await buffer.put({"status": "FAILED", "id": job_id, "err": "Max Retries/Block"})
            
            queue.task_done()

async def processor(buffer, pbar, node_url, node_id):
    """
    Consumes from buffer and sends to a specific GPU Node URL.
    """
    client = AsyncOpenAI(base_url=node_url, api_key="EMPTY")
    conn = sqlite3.connect(DB_PATH, timeout=60)
    
    batch = []
    
    while True:
        item = await buffer.get()
        if item is None:
            buffer.task_done()
            break
        
        batch.append(item)
        buffer.task_done()
        
        if len(batch) >= BATCH_SIZE:
            success = [x for x in batch if x["status"] == "SUCCESS"]
            others = [x for x in batch if x["status"] != "SUCCESS"]
            
            if success:
                try:
                    # Instruct format adds tokens, so we rely on MAX_CHARS to keep us safe
                    inputs = [f"Instruct: Retrieve financial insights.\nQuery: {x['text']}" for x in success]
                    
                    resp = await client.embeddings.create(input=inputs, model="intfloat/e5-mistral-7b-instruct")
                    vecs = [d.embedding for d in resp.data]
                    
                    ts = int(time.time())
                    v_int8 = (np.array(vecs) * 100).astype(np.int8).tolist()
                    
                    save_path = f"{DATA_DIR}/text/batch_{ts}_node_{node_id}.parquet"
                    
                    pl.DataFrame(success).with_columns(pl.Series("vector", v_int8))\
                        .select(["id", "url", "code", "text", "vector"])\
                        .write_parquet(save_path)
                    
                    if os.path.exists(save_path):
                        ids = [x["id"] for x in success]
                        await asyncio.sleep(random.uniform(0.01, 0.2)) 
                        conn.executemany("UPDATE job_queue SET status='COMPLETED' WHERE id=?", [(i,) for i in ids])
                        log_to_file(f"Node {node_id}: Saved {len(success)} docs.")
                
                except BadRequestError as e:
                    # Context Length Error Catch
                    log_to_file(f"Node {node_id} CONTEXT ERROR: {e}")
                    # Fail this batch so we don't hang, but mark them for review
                    for x in success:
                        others.append({**x, "status": "FAILED", "err": "Context Length Exceeded"})
                except Exception as e:
                    log_to_file(f"Node {node_id} Error: {e}")
                    others.extend(success) 
            
            if others:
                updates = []
                for x in others:
                    new_status = x.get("status", "FAILED")
                    # If it was a generic error (not context), retry later
                    if new_status == "SUCCESS": new_status = "PENDING" 
                    updates.append((new_status, x.get("err", "Unknown"), x.get("id", 0)))
                
                for _ in range(5):
                    try:
                        conn.executemany("UPDATE job_queue SET status=?, error_log=? WHERE id=?", updates)
                        conn.commit()
                        break
                    except sqlite3.OperationalError:
                        await asyncio.sleep(0.5)
            
            try:
                conn.commit()
            except: 
                pass

            pbar.update(len(batch))
            batch = []

async def main():
    os.makedirs(f"{DATA_DIR}/text", exist_ok=True)
    
    # 1. Initialize and Load Data
    init_db()
    hydrate_queue() 
    
    conn = sqlite3.connect(DB_PATH)
    pending_count = conn.execute("SELECT count(*) FROM job_queue WHERE status='PENDING'").fetchone()[0]
    if pending_count == 0:
        print("⚠️ WARNING: No PENDING jobs found. Check 'priority_queue.csv'.")
        return

    queue = asyncio.Queue(maxsize=500) 
    buffer = asyncio.Queue(maxsize=500)
    cpu_pool = ProcessPoolExecutor(max_workers=NUM_CPU_WORKERS)
    
    pbar = tqdm(total=TOTAL_DOCS, unit="doc", desc="🚀 8-Node Cluster Inference")
    completed = conn.execute("SELECT count(*) FROM job_queue WHERE status='COMPLETED'").fetchone()[0]
    pbar.update(completed)
    
    async def loader():
        cursor = conn.execute("SELECT id, url, stock_code FROM job_queue WHERE status='PENDING'")
        while True:
            if queue.full():
                await asyncio.sleep(1)
                continue
            rows = cursor.fetchmany(200)
            if not rows: break
            for row in rows: await queue.put(row)
        for _ in range(MAX_CONCURRENT_DOWNLOADS): await queue.put(None)
    
    loader_task = asyncio.create_task(loader())
    
    downloaders = [asyncio.create_task(downloader(queue, buffer, cpu_pool)) for _ in range(MAX_CONCURRENT_DOWNLOADS)]
    
    processors = [asyncio.create_task(processor(buffer, pbar, url, i)) for i, url in enumerate(VLLM_NODES)]
    
    await loader_task
    await asyncio.gather(*downloaders)
    
    for _ in range(len(processors)):
        await buffer.put(None)
        
    await asyncio.gather(*processors)
    
    cpu_pool.shutdown()
    pbar.close()

if __name__ == "__main__":
    asyncio.run(main())