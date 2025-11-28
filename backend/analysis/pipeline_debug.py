import os
import sys
import logging
import asyncio
import sqlite3
import time
import signal
import psutil
from concurrent.futures import ProcessPoolExecutor
from docling.document_converter import DocumentConverter

# CONFIG
DB_PATH = "pipeline_state.db"
LOG_FILE = "crash_debug.log"
NUM_WORKERS = 4  # Reduced from 20 to 4 to test stability
BATCH_SIZE = 10  # Tiny batch to see immediate results

# Setup File Logging (So we can see the error even if SSH disconnects)
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def log_memory():
    """Logs RAM usage to detect leaks"""
    mem = psutil.virtual_memory()
    logging.info(f"RAM: {mem.percent}% used ({mem.available // (1024*1024)}MB free)")

def process_doc_task(task_data):
    """CPU Worker"""
    job_id, url, stock_code = task_data
    try:
        converter = DocumentConverter()
        result = converter.convert(url)
        md = result.document.export_to_markdown()
        return {"status": "SUCCESS", "job_id": job_id}
    except Exception as e:
        return {"status": "FAILED", "job_id": job_id, "error": str(e)}

async def main():
    print(f"🕵️ Debug Mode Started. Tailing {LOG_FILE}...")
    logging.info("Pipeline Restarted.")
    
    conn = sqlite3.connect(DB_PATH)
    
    # Auto-Repair Orphans
    conn.execute("UPDATE job_queue SET status='PENDING' WHERE status='PROCESSING'")
    conn.commit()
    logging.info("Orphaned jobs reset to PENDING.")
    
    executor = ProcessPoolExecutor(max_workers=NUM_WORKERS)
    
    try:
        while True:
            log_memory()
            cursor = conn.execute("SELECT id, url, stock_code FROM job_queue WHERE status='PENDING' LIMIT ?", (BATCH_SIZE,))
            tasks = cursor.fetchall()
            
            if not tasks:
                logging.info("Queue Empty.")
                break
                
            # Mark Processing
            task_ids = [t[0] for t in tasks]
            placeholders = ",".join("?" * len(task_ids))
            conn.execute(f"UPDATE job_queue SET status='PROCESSING' WHERE id IN ({placeholders})", task_ids)
            conn.commit()
            
            logging.info(f"Processing batch of {len(tasks)} docs...")
            
            # Run (CPU Only for this test)
            loop = asyncio.get_running_loop()
            futures = [loop.run_in_executor(executor, process_doc_task, task) for task in tasks]
            results = await asyncio.gather(*futures)
            
            success_count = len([r for r in results if r["status"] == "SUCCESS"])
            logging.info(f"Batch Complete. Success: {success_count}/{len(tasks)}")
            
            # Update DB
            for res in results:
                status = "COMPLETED" if res["status"] == "SUCCESS" else "FAILED"
                error = res.get("error", "")
                conn.execute("UPDATE job_queue SET status=?, error_log=? WHERE id=?", (status, error, res["job_id"]))
            conn.commit()
            
    except Exception as e:
        logging.critical(f"CRASH: {e}", exc_info=True)
    finally:
        conn.close()
        executor.shutdown()

if __name__ == "__main__":
    asyncio.run(main())