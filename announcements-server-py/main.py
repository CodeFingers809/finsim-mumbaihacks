import requests
import pandas as pd
import time
import os
import random
from datetime import datetime, timedelta
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# --- CONFIGURATION ---
START_DATE = "2025-11-22"  # Continue from where you stopped
END_DATE = "2025-12-26"    # Up to today
OUTPUT_DIR = "bse_data"
BASE_URL = "https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w"

# New headers to evade detection
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/corporates/ann.html",
    "Origin": "https://www.bseindia.com",
    "Accept": "application/json, text/plain, */*",
    "Connection": "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site"
}

class BSEScraper:
    def __init__(self, output_dir=OUTPUT_DIR):
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        self.session = self._create_session()

    def _create_session(self):
        session = requests.Session()
        retry = Retry(
            total=3,
            backoff_factor=2, # Wait 2s, 4s, 8s on error
            status_forcelist=[403, 500, 502, 503, 504],
            allowed_methods=["GET"]
        )
        adapter = HTTPAdapter(max_retries=retry)
        session.mount("https://", adapter)
        session.headers.update(HEADERS)
        
        # Prime cookies by visiting homepage
        try:
            print("Priming session cookies...")
            session.get("https://www.bseindia.com/corporates/ann.html", timeout=10)
        except:
            pass
        return session

    def fetch_data_for_date(self, date_str):
        daily_records = []
        page = 1
        max_pages = 100

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
                # Add random jitter to request timing to look human
                time.sleep(random.uniform(0.5, 1.5))
                
                response = self.session.get(BASE_URL, params=params, timeout=20)
                
                if response.status_code == 403:
                    print(f"[{date_str}] 403 Forbidden! Waiting 10s...")
                    time.sleep(10)
                    return daily_records # Stop for this date

                if response.status_code != 200:
                    break

                data = response.json()
                
                if isinstance(data, dict) and "Table" in data and data["Table"]:
                    batch = data["Table"]
                    count = len(batch)
                    print(f"[{date_str}] Page {page}: Found {count} records", end="\r")
                    daily_records.extend(batch)
                    
                    if count < 10: # Last page usually has fewer records
                        break
                    
                    page += 1
                else:
                    break
                    
            except Exception as e:
                print(f"[{date_str}] Error on page {page}: {e}")
                break

        print(f"[{date_str}] DONE. Total: {len(daily_records)}            ")
        return daily_records

    def fetch_date_range_sequential(self, start_date_str, end_date_str):
        """Fetches dates one by one (NO PARALLELISM)"""
        start = datetime.strptime(start_date_str, "%Y-%m-%d")
        end = datetime.strptime(end_date_str, "%Y-%m-%d")
        
        all_records = []
        curr = start
        
        print(f"--- Starting Sequential Fetch (Safe Mode) ---")

        while curr <= end:
            date_str = curr.strftime("%Y%m%d")
            
            # Fetch single day
            records = self.fetch_data_for_date(date_str)
            all_records.extend(records)
            
            curr += timedelta(days=1)
            
            # MANDATORY DELAY between DAYS
            print("Cooling down (2 seconds)...")
            time.sleep(2) 

        return all_records

    def save_records(self, raw_items, start_date, end_date):
        if not raw_items:
            print("No records found.")
            return

        clean_data = []
        for item in raw_items:
            attachment = item.get('ATTACHMENTNAME', '')
            pdf_url = f"https://www.bseindia.com/xml-data/corpfiling/AttachLive/{attachment}" if attachment else "N/A"
            
            clean_data.append({
                "Stock_Code": item.get("SCRIP_CD"),
                "Stock_Name": item.get("SLONGNAME"),
                "Category": item.get("CATEGORYNAME"),
                "Subject": item.get("NEWSSUB"),
                "Date_Time": item.get("NEWS_DT"),
                "PDF_URL": pdf_url,
                "Description": item.get("MORE")
            })

        df = pd.DataFrame(clean_data)
        df.drop_duplicates(subset=['Stock_Code', 'Subject', 'Date_Time'], inplace=True)
        
        # Sort
        try:
            df['Date_Obj'] = pd.to_datetime(df['Date_Time'], errors='coerce')
            df.sort_values(by='Date_Obj', ascending=False, inplace=True)
            df.drop(columns=['Date_Obj'], inplace=True)
        except: pass

        filename = os.path.join(self.output_dir, f"bse_announcements_{start_date}_to_{end_date}.csv")
        df.to_csv(filename, index=False)
        print(f"\nSUCCESS: Saved {len(df)} records to {filename}")

if __name__ == "__main__":
    # RESET Your Dates Here
    scraper = BSEScraper()
    records = scraper.fetch_date_range_sequential(START_DATE, END_DATE)
    scraper.save_records(records, START_DATE, END_DATE)
