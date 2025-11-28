import requests
import pandas as pd
from datetime import datetime, timedelta
import time
import json
import os
import concurrent.futures
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# --- CONFIGURATION ---
START_DATE = "2025-08-20" 
END_DATE = "2025-11-24"
MAX_WORKERS = 10  # Number of parallel downloads (Don't go above 10 or BSE might ban IP)

BASE_URL = "https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
    "Origin": "https://www.bseindia.com",
    "Accept": "application/json, text/plain, */*",
    "Connection": "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site"
}

def create_session():
    """
    Creates a robust session with retry logic, backoff, and connection pooling.
    """
    session = requests.Session()
    
    retry = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[403, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )
    
    # pool_maxsize=MAX_WORKERS * 2 ensures we have enough connections in the pool
    adapter = HTTPAdapter(max_retries=retry, pool_connections=20, pool_maxsize=20)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update(HEADERS)
    
    return session

def fetch_daily_announcements(session, date_str):
    """
    Fetches ALL pages for a single specific date.
    """
    daily_records = []
    page = 1
    max_pages = 150 

    # print(f"[{date_str}] Starting fetch...") # Commented out to reduce noise

    while page <= max_pages:
        params = {
            "strCat": "-1",          
            "strPrevDate": date_str, 
            "strScrip": "",          
            "strSearch": "P",        
            "strToDate": date_str,   
            "strType": "C",
            "Pageno": page
        }
        
        try:
            response = session.get(BASE_URL, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if "Table" in data and data["Table"]:
                    records_count = len(data["Table"])
                    # Log with Date prefix so parallel logs make sense
                    print(f"[{date_str}] Page {page}: Found {records_count} records")
                    daily_records.extend(data["Table"])
                    
                    if records_count < 10:
                        break
                    
                    page += 1
                    time.sleep(0.2) 
                else:
                    # print(f"[{date_str}] No more data.")
                    break
            else:
                print(f"[{date_str}] Error: Status {response.status_code}")
                break
                
        except requests.exceptions.ReadTimeout:
            print(f"[{date_str}] Timeout on Page {page}. Retrying...")
            break 
        except Exception as e:
            print(f"[{date_str}] Exception on page {page}: {e}")
            break
            
    return daily_records

def fetch_date_range(start_date_str, end_date_str):
    """
    Uses Parallel Workers to fetch multiple dates at once.
    """
    start = datetime.strptime(start_date_str, "%Y-%m-%d")
    end = datetime.strptime(end_date_str, "%Y-%m-%d")
    
    # Generate list of dates to fetch
    date_list = []
    current_date = start
    while current_date <= end:
        date_list.append(current_date.strftime("%Y%m%d"))
        current_date += timedelta(days=1)
    
    all_range_records = []
    
    # Create a SINGLE session to share the connection pool across threads
    # This is thread-safe for requests.Session in read-only mode
    session = create_session()
    
    print(f"--- Starting Parallel Fetch (Workers: {MAX_WORKERS}) ---")
    
    # Use ThreadPoolExecutor for I/O bound tasks
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all tasks
        future_to_date = {executor.submit(fetch_daily_announcements, session, date_str): date_str for date_str in date_list}
        
        for future in concurrent.futures.as_completed(future_to_date):
            date_str = future_to_date[future]
            try:
                data = future.result()
                all_range_records.extend(data)
                print(f"[{date_str}] DONE. Total records: {len(data)}")
            except Exception as exc:
                print(f"[{date_str}] Generated an exception: {exc}")

    # Sort results by date/time because parallel execution messes up the order
    # Note: 'NEWS_DT' is the timestamp string
    try:
        all_range_records.sort(key=lambda x: x.get('NEWS_DT', ''), reverse=True)
    except:
        pass # Ignore sort errors if data is messy

    return all_range_records

def save_to_knowledge_base(raw_items, start_date, end_date):
    """
    Parses and saves the aggregated list to CSV.
    """
    if not raw_items:
        print("\nNo records found in the specified range.")
        return None

    clean_records = []
    for item in raw_items:
        attachment = item.get('ATTACHMENTNAME', '')
        pdf_link = f"https://www.bseindia.com/xml-data/corpfiling/AttachLive/{attachment}" if attachment else "N/A"
        
        record = {
            "Stock_Code": item.get("SCRIP_CD"),
            "Stock_Name": item.get("SLONGNAME"), 
            "Category": item.get("CATEGORYNAME"),
            "Subject": item.get("NEWSSUB"),
            "Date_Time": item.get("NEWS_DT"), 
            "PDF_URL": pdf_link,
            "Description": item.get("MORE") 
        }
        clean_records.append(record)

    df = pd.DataFrame(clean_records)
    df.drop_duplicates(subset=['Stock_Code', 'Subject', 'Date_Time'], inplace=True)

    filename = f"bse_announcements_{start_date}_to_{end_date}.csv"
    
    try:
        df.to_csv(filename, index=False)
        print(f"\nSUCCESS: Saved {len(df)} unique announcements to {filename}")
        return filename
    except Exception as e:
        print(f"Error saving file: {e}")
        return None

if __name__ == "__main__":
    if not START_DATE:
        START_DATE = datetime.now().strftime("%Y-%m-%d")
    if not END_DATE:
        END_DATE = datetime.now().strftime("%Y-%m-%d")
        
    print(f"Range: {START_DATE} to {END_DATE}")
    
    records = fetch_date_range(START_DATE, END_DATE)
    save_to_knowledge_base(records, START_DATE, END_DATE)