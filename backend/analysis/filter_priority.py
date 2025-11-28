import polars as pl
import os

# CONFIGURATION
ANNOUNCEMENT_CSV = "merged.csv"
EQT_FILE = "EQT0.csv"
EQUITY_FILE = "Equity.csv"

def analyze_dataset():
    print("🚀 Loading Master Data...")

    try:
        # FIX 1: Add truncate_ragged_lines=True to handle the ",,,,," at the end of rows
        df_eqt = pl.read_csv(EQT_FILE, infer_schema_length=0, ignore_errors=True, truncate_ragged_lines=True)
        df_eq = pl.read_csv(EQUITY_FILE, infer_schema_length=0, ignore_errors=True, truncate_ragged_lines=True)

        # Select only needed columns to ensure stacking works even if extra junk columns exist
        cols = ["Security Code", "Security Name", "Status", "Group"]

        # Clean columns: Filter to only those that actually exist in the file
        eqt_cols = [c for c in cols if c in df_eqt.columns]
        eq_cols = [c for c in cols if c in df_eq.columns]

        master = pl.concat([
            df_eqt.select(eqt_cols),
            df_eq.select(eq_cols)
        ]).unique(subset=["Security Code"])

        print(f"✅ Master Map Verified: {master.height} unique stocks.")

    except Exception as e:
        print(f"❌ Error loading master files: {e}")
        return

    print(f"🚀 Loading Announcements (Eager Mode for Stability)...")

    # FIX 2: Use read_csv with truncate_ragged_lines=True
    # This chops off the extra commas that are crashing the script
    try:
        df = pl.read_csv(ANNOUNCEMENT_CSV, infer_schema_length=0, ignore_errors=True, truncate_ragged_lines=True)
    except Exception as e:
        print(f"❌ Error reading Announcement CSV: {e}")
        return

    # 3. Clean & Cast
    print("⚡ Filtering Data...")
    df = df.with_columns([
        pl.col("Stock_Code").cast(pl.Utf8),
        pl.col("Date_Time").str.to_datetime(strict=False).alias("timestamp")
    ])

    # 4. Filter Date (Post 2020)
    df = df.filter(pl.col("timestamp").dt.year() >= 2020)

    # 5. Join (Left Join)
    df = df.join(master, left_on="Stock_Code", right_on="Security Code", how="left")

    print(f"\n📊 DATA REPORT (2020-2025)")
    print(f"===========================")
    print(f"Total Rows: {df.height:,}")

    if df.height == 0:
        print("❌ No rows found. Check Date Format in CSV.")
        return

    # 6. Keyword Signal Check
    keywords = ["financial", "result", "outcome", "board meeting", "press release", "investor"]

    if "Subject" in df.columns:
        filtered = df.filter(pl.col("Subject").str.to_lowercase().str.contains("|".join(keywords)))
        print(f"💰 High Value 'Signal' Rows: {filtered.height:,}")

        # Save the Priority Queue for the GPU
        print("💾 Saving 'priority_queue.csv'...")

        # Select columns if they exist
        out_cols = ["PDF_URL", "Stock_Code", "Subject", "Category"]
        valid_out_cols = [c for c in out_cols if c in filtered.columns]

        filtered.select(valid_out_cols).write_csv("priority_queue.csv")
        print(f"✅ Saved {filtered.height:,} high-priority URLs to 'priority_queue.csv'.")
    else:
        print("⚠️ Column 'Subject' not found. Check CSV headers.")

if __name__ == "__main__":
    analyze_dataset()