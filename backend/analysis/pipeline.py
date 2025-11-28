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
import fitz  # PyMuPDF
from datetime import datetime
from tqdm import tqdm
from aiohttp import ClientTimeout, TCPConnector
from openai import AsyncOpenAI
from concurrent.futures import ProcessPoolExecutor

# ================= CONFIGURATION =================
VLLM_API_URL = "http://localhost:8000/v1"
DATA_DIR = "./data_lake"
DB_PATH = "pipeline_state.db"
PRIORITY_CSV = "priority_queue.csv"
LOG_FILE = "batch_history.log"

# SUPER STEALTH SETTINGS
BATCH_SIZE = 50                # Smaller batches to save progress often
MAX_CONCURRENT_DOWNLOADS = 8   # <--- CRITICAL REDUCTION (Was 64)
NUM_CPU_WORKERS = 8            # Match downloaders
DOWNLOAD_TIMEOUT = 120         # Give them plenty of time
TOTAL_DOCS = 36478

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
    conn.execute("PRAGMA synchronous=NORMAL;") # Speed up writes safely
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
    count = conn.execute("SELECT count(*) FROM job_queue").fetchone()[0]
    if count == 0:
        print("🚀 Hydrating Queue...")
        df = pl.read_csv(PRIORITY_CSV)
        rows = [(i, row["PDF_URL"], str(row["Stock_Code"])) 
                for i, row in enumerate(df.iter_rows(named=True))]
        conn.executemany("INSERT INTO job_queue (id, url, stock_code) VALUES (?, ?, ?)", rows)
        conn.commit()
    conn.close()

# ================= WORKERS =================
def parse_pdf_bytes(args):
    job_id, content, stock_code, url = args
    try:
        with fitz.open(stream=content, filetype="pdf") as doc:
            text = "\n".join([page.get_text() for page in doc])
        
        if not text or len(text.strip()) < 50:
            return {"status": "SKIPPED_EMPTY", "id": job_id, "err": "Empty"}
            
        return {"status": "SUCCESS", "id": job_id, "url": url, "code": stock_code, "text": text}
    except Exception as e:
        return {"status": "FAILED", "id": job_id, "err": str(e)[:50]}

async def downloader(queue, buffer, cpu_pool):
    timeout = ClientTimeout(total=DOWNLOAD_TIMEOUT)
    # Limit DNS cache to prevent memory leak
    conn = TCPConnector(limit=0, ttl_dns_cache=300)
    loop = asyncio.get_running_loop()
    
    async with aiohttp.ClientSession(connector=conn, timeout=timeout) as session:
        while True:
            item = await queue.get()
            if item is None: await buffer.put(None); queue.task_done(); break
            
            job_id, url, code = item
            
            # RETRY LOOP (Internal)
            success = False
            for attempt in range(3):
                try:
                    # HIGH JITTER: 1s to 3s sleep to avoid rate limits
                    await asyncio.sleep(random.uniform(1.0, 3.0)) 
                    
                    headers = {"User-Agent": random.choice(USER_AGENTS)}
                    async with session.get(url, headers=headers) as resp:
                        if resp.status == 200:
                            content = await resp.read()
                            # Parse
                            result = await loop.run_in_executor(cpu_pool, parse_pdf_bytes, (job_id, content, code, url))
                            await buffer.put(result)
                            success = True
                            break
                        elif resp.status in [403, 429]:
                            # If blocked, wait 30s and retry
                            await asyncio.sleep(30)
                        else:
                            # Other error, small wait
                            await asyncio.sleep(2)
                except Exception:
                    await asyncio.sleep(1)
            
            if not success:
                await buffer.put({"status": "FAILED", "id": job_id, "err": "Max Retries/Block"})
            
            queue.task_done()

async def processor(buffer, total):
    client = AsyncOpenAI(base_url=VLLM_API_URL, api_key="EMPTY")
    conn = sqlite3.connect(DB_PATH, timeout=60)
    
    batch = []
    pbar = tqdm(total=TOTAL_DOCS, unit="doc", desc="🚀 Stealth Client")
    
    # Resume progress bar
    completed = conn.execute("SELECT count(*) FROM job_queue WHERE status='COMPLETED'").fetchone()[0]
    pbar.update(completed)
    
    while True:
        item = await buffer.get()
        if item is None: buffer.task_done(); break
        
        batch.append(item)
        buffer.task_done()
        
        if len(batch) >= BATCH_SIZE:
            success = [x for x in batch if x["status"] == "SUCCESS"]
            others = [x for x in batch if x["status"] != "SUCCESS"]
            
            if success:
                try:
                    inputs = [f"Instruct: Retrieve financial insights.\nQuery: {x['text'][:8000]}" for x in success]
                    resp = await client.embeddings.create(input=inputs, model="intfloat/e5-mistral-7b-instruct")
                    vecs = [d.embedding for d in resp.data]
                    
                    ts = int(time.time())
                    v_int8 = (np.array(vecs) * 100).astype(np.int8).tolist()
                    
                    save_path = f"{DATA_DIR}/text/batch_{ts}.parquet"
                    pl.DataFrame(success).with_columns(pl.Series("vector", v_int8))\
                        .select(["id", "url", "code", "text", "vector"])\
                        .write_parquet(save_path)
                    
                    if os.path.exists(save_path):
                        ids = [x["id"] for x in success]
                        conn.executemany("UPDATE job_queue SET status='COMPLETED' WHERE id=?", [(i,) for i in ids])
                        log_to_file(f"Saved {len(success)} docs.")
                except Exception as e:
                    log_to_file(f"GPU/Save Error: {e}")
                    # Do not fail them, reset to PENDING to try later
                    others.extend(success) 
            
            if others:
                updates = []
                for x in others:
                    # If we failed to save/embed, reset to PENDING. Only truly broken downloads go to FAILED/SKIPPED
                    new_status = x.get("status", "FAILED")
                    if new_status == "SUCCESS": new_status = "PENDING" 
                    updates.append((new_status, x.get("err", "Unknown"), x.get("id", 0)))
                    
                conn.executemany("UPDATE job_queue SET status=?, error_log=? WHERE id=?", updates)
            
            conn.commit()
            pbar.update(len(batch))
            batch = []

async def main():
    os.makedirs(f"{DATA_DIR}/text", exist_ok=True)
    init_db()
    
    conn = sqlite3.connect(DB_PATH)
    # LIMIT QUEUE SIZE to prevent OOM "Killed" error
    queue = asyncio.Queue(maxsize=200) 
    buffer = asyncio.Queue(maxsize=200)
    cpu_pool = ProcessPoolExecutor(max_workers=NUM_CPU_WORKERS)
    
    cursor = conn.execute("SELECT id, url, stock_code FROM job_queue WHERE status='PENDING'")
    
    async def loader():
        while True:
            # BACKPRESSURE: Don't read DB if queue is full
            if queue.full():
                await asyncio.sleep(1)
                continue
            rows = cursor.fetchmany(100)
            if not rows: break
            for row in rows: await queue.put(row)
        for _ in range(MAX_CONCURRENT_DOWNLOADS): await queue.put(None)
    
    asyncio.create_task(loader())
    
    workers = [asyncio.create_task(downloader(queue, buffer, cpu_pool)) for _ in range(MAX_CONCURRENT_DOWNLOADS)]
    await processor(buffer, TOTAL_DOCS)
    
    cpu_pool.shutdown()

if __name__ == "__main__":
    asyncio.run(main())