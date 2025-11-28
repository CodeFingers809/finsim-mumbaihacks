import sqlite3
import polars as pl
import os
import glob
import torch

DB_PATH = "pipeline_state.db"
DATA_DIR = "./data_lake/text"

def main():
    print("\n🔎 --- DATABASE HEALTH CHECK ---")
    conn = sqlite3.connect(DB_PATH)
    
    # Check Status Counts
    cursor = conn.execute("SELECT status, count(*) FROM job_queue GROUP BY status")
    rows = cursor.fetchall()
    
    print("📊 Job Status Distribution:")
    for status, count in rows:
        print(f"   {status:<15}: {count:,}")
    conn.close()

    print("\n📂 --- PARQUET DATA INSPECTION ---")
    files = glob.glob(f"{DATA_DIR}/*.parquet")
    
    if not files:
        print("❌ No Parquet files found!")
        return

    print(f"✅ Found {len(files)} batches saved to disk.")
    
    # Sort by modification time to get the latest
    latest_file = max(files, key=os.path.getmtime)
    print(f"💾 Latest Batch: {os.path.basename(latest_file)}")
    
    try:
        df = pl.read_parquet(latest_file)
        print(f"   ➡️ Records: {len(df)}")
        print(f"   ➡️ Columns: {df.columns}")
        
        # Check for vectors
        if "vector" in df.columns:
            vec = df["vector"][0]
            print(f"   ➡️ Sample Vector Shape: {len(vec)}")
            print(f"   ➡️ Vector Type: {type(vec)}")
        
        # Check text preview (Fixed column name 'text')
        if "text" in df.columns:
            print(f"   ➡️ Text Preview: {df['text'][0][:100]}...")
        else:
            print("   ⚠️ Column 'text' not found (did you mean 'content'?)")

    except Exception as e:
        print(f"❌ Error reading Parquet: {e}")

if __name__ == "__main__":
    main()