import pandas as pd
import requests
import hashlib
import io
import os
import concurrent.futures
from pypdf import PdfReader
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# --- CONFIGURATION ---
# 1. Put the EXACT path to the CSV you just generated here:
INPUT_CSV_PATH = r"bse_data/bse_announcements_2025-11-20_to_2025-11-21.csv"

# 2. Where do you want the text files to go?
OUTPUT_DIR = "bse_data"
TEXT_OUTPUT_DIR = os.path.join(OUTPUT_DIR, "text_content")

# 3. Parallel Workers (Don't go too high or you might get IP blocked)
MAX_WORKERS = 10 

# Ensure directories exist
if not os.path.exists(TEXT_OUTPUT_DIR):
    os.makedirs(TEXT_OUTPUT_DIR)

# --- SESSION SETUP ---
def create_session():
    """Creates a robust session with retries."""
    s = requests.Session()
    retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    s.mount("https://", HTTPAdapter(max_retries=retries, pool_connections=MAX_WORKERS, pool_maxsize=MAX_WORKERS))
    s.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    return s

# --- PROCESSING FUNCTION ---
def process_record(row, session):
    """
    Takes a single row from the DataFrame, downloads the PDF, 
    extracts text, and returns the updated metadata columns.
    """
    pdf_url = row.get('PDF_URL')
    scrip_code = str(row.get('Stock_Code', 'Unknown'))
    
    # Initialize default return values
    result = {
        "File_Hash_SHA256": None,
        "Text_Filename": None,
        "Processing_Status": "Failed", # Failed, Success, No URL, Skipped
        "Text_Preview": None # Optional: First 100 chars for debugging
    }

    if not pdf_url or pd.isna(pdf_url) or pdf_url == "N/A":
        result["Processing_Status"] = "No URL"
        return result

    try:
        # Download PDF
        r = session.get(pdf_url, timeout=15)
        if r.status_code != 200:
            result["Processing_Status"] = f"HTTP {r.status_code}"
            return result
        
        pdf_bytes = r.content
        
        # 1. Calculate Hash
        file_hash = hashlib.sha256(pdf_bytes).hexdigest()
        result["File_Hash_SHA256"] = file_hash
        
        # 2. Check if file already exists (Optimization: Don't re-save if we have it)
        txt_filename = f"{scrip_code}_{file_hash[:10]}.txt"
        txt_path = os.path.join(TEXT_OUTPUT_DIR, txt_filename)
        
        result["Text_Filename"] = txt_filename
        
        if os.path.exists(txt_path):
            result["Processing_Status"] = "Exists (Skipped Download)"
            return result

        # 3. Extract Text
        text_content = ""
        try:
            with io.BytesIO(pdf_bytes) as f:
                reader = PdfReader(f)
                if reader.is_encrypted:
                    try: reader.decrypt("")
                    except: pass
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text_content += extracted + "\n"
        except Exception as e:
            text_content = f"[PDF Parsing Error: {str(e)}]"

        if not text_content.strip():
            text_content = "[No text extracted - Likely a scanned image]"

        # 4. Save Text File
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(text_content)

        result["Processing_Status"] = "Success"
        # result["Text_Preview"] = text_content[:50].replace("\n", " ") # Optional
        
        return result

    except Exception as e:
        result["Processing_Status"] = f"Error: {str(e)}"
        return result

# --- MAIN EXECUTION ---
def main():
    print(f"Loading CSV: {INPUT_CSV_PATH}...")
    try:
        df = pd.read_csv(INPUT_CSV_PATH)
    except FileNotFoundError:
        print("Error: CSV file not found. Please check the path.")
        return

    print(f"Loaded {len(df)} records. Starting PDF processing with {MAX_WORKERS} workers...")
    
    # Create a session to share connection pooling
    session = create_session()
    
    # We will store results here
    updates = []
    
    # Use ThreadPoolExecutor for parallel processing
    total = len(df)
    completed = 0
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Prepare arguments: (row (as dict), session)
        # We iterate over df.to_dict('records') to safely pass rows
        future_to_index = {
            executor.submit(process_record, row, session): index 
            for index, row in df.iterrows()
        }
        
        for future in concurrent.futures.as_completed(future_to_index):
            index = future_to_index[future]
            try:
                data = future.result()
                # We need to map the result back to the specific row index
                updates.append((index, data))
            except Exception as exc:
                print(f"Row {index} generated an exception: {exc}")
            
            completed += 1
            if completed % 100 == 0:
                print(f"Progress: {completed}/{total} records processed...", end="\r")

    print("\nProcessing complete. Merging data...")

    # Update the DataFrame with new columns
    # We create a temporary DF from updates and join it
    update_dict = {
        idx: val for idx, val in updates
    }
    
    # Initialize new columns
    df["File_Hash_SHA256"] = None
    df["Text_Filename"] = None
    df["Processing_Status"] = None

    # Apply updates
    for idx, data in update_dict.items():
        df.at[idx, "File_Hash_SHA256"] = data["File_Hash_SHA256"]
        df.at[idx, "Text_Filename"] = data["Text_Filename"]
        df.at[idx, "Processing_Status"] = data["Processing_Status"]

    # Save Final CSV
    output_csv_name = INPUT_CSV_PATH.replace(".csv", "_FINAL_WITH_TEXT.csv")
    df.to_csv(output_csv_name, index=False)
    
    print("="*60)
    print(f"DONE!")
    print(f"1. Final Metadata CSV: {output_csv_name}")
    print(f"2. Text Files Folder:  {TEXT_OUTPUT_DIR}")
    print("="*60)

if __name__ == "__main__":
    main()