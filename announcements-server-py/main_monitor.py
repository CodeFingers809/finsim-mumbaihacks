import time
import schedule
import requests
import hashlib
import json
import sys
import os
import fitz # PyMuPDF
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# --- IMPORTS ---
from config import REALTIME_CSV_PATH, REALTIME_TEXT_DIR
from user_manager import UserManager
from storage_engine import StorageEngine
from whatsapp import WhatsAppClient

# Silence MuPDF
if hasattr(fitz, "TOOLS") and hasattr(fitz.TOOLS, "mupdf_display_errors"):
    fitz.TOOLS.mupdf_display_errors(False)

BASE_API_URL = "https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w"

class BSEBroadcaster:
    def __init__(self):
        self.user_manager = UserManager()
        self.storage = StorageEngine()
        self.whatsapp = WhatsAppClient()
        self.session = self._create_session()
        self.seen_ids = set() 
        print("🚀 Real-Time WhatsApp Monitor Started")

    def _create_session(self):
        s = requests.Session()
        retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
        s.mount("https://", HTTPAdapter(max_retries=retries))
        s.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.bseindia.com/corporates/ann.html"
        })
        try: s.get("https://www.bseindia.com/corporates/ann.html", timeout=10)
        except: pass
        return s

    def _get_unique_id(self, item):
        raw = f"{item.get('SCRIP_CD')}{item.get('NEWS_DT')}{item.get('ATTACHMENTNAME')}"
        return hashlib.md5(raw.encode()).hexdigest()

    def download_file(self, pdf_url):
        if not pdf_url: return None, "[No PDF]", "N/A"
        try:
            r = self.session.get(pdf_url, timeout=15)
            if r.status_code != 200: return None, "[Download Failed]", "N/A"
            
            pdf_bytes = r.content
            file_hash = hashlib.sha256(pdf_bytes).hexdigest()
            
            text = ""
            try:
                with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                    for page in doc: text += page.get_text() + "\n"
            except: text = "[Scanned Image]"
            
            return pdf_bytes, (text if text.strip() else "[Scanned Image]"), file_hash
        except: return None, "[Error Extracting]", "N/A"

    def match_user_requirements(self, payload, user_prefs):
        # 1. Scrip Filter (CHANGED: accessing 'Stock_Code')
        if user_prefs["scrips"]: 
            if str(payload['Stock_Code']) not in user_prefs["scrips"]: return False
        
        # 2. Category Filter (Category is same)
        if user_prefs["categories"]:
            if not any(c.lower() in payload['Category'].lower() for c in user_prefs["categories"]): return False
        
        # 3. Keyword Filter (CHANGED: accessing 'Subject')
        if user_prefs["keywords"]:
            if not any(kw.lower() in payload['Subject'].lower() for kw in user_prefs["keywords"]): return False
        
        return True

    def broadcast(self, payload, local_pdf_path):
        """
        Send alert to backend, which will handle user matching and WhatsApp forwarding
        """
        from config import BACKEND_ALERT_ENDPOINT
        
        print(f"\n📢 Broadcasting: {payload['Subject']}")
        
        try:
            # Send to backend
            response = requests.post(
                BACKEND_ALERT_ENDPOINT,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                sent_count = result.get('sent_count', 0)
                print(f"   ✅ Alert sent to {sent_count} users via backend")
            else:
                print(f"   ❌ Backend error: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Failed to send to backend: {e}")

    def check_updates(self):
        print(".", end="", flush=True)
        now_str = datetime.now().strftime("%Y%m%d")
        
        params = {
            "strCat": "-1", "strPrevDate": now_str, "strScrip": "",
            "strSearch": "P", "strToDate": now_str, "strType": "C", "Pageno": "1"
        }

        try:
            resp = self.session.get(BASE_API_URL, params=params, timeout=10)
            if resp.status_code != 200: return
            
            data = resp.json()
            if "Table" not in data: return

            for item in reversed(data["Table"]):
                uid = self._get_unique_id(item)
                
                if uid not in self.seen_ids:
                    # 1. Download Content
                    attachment = item.get('ATTACHMENTNAME')
                    url = f"https://www.bseindia.com/xml-data/corpfiling/AttachLive/{attachment}" if attachment else None
                    
                    pdf_bytes, text, fhash = self.download_file(url)

                    # --- CHANGED: PAYLOAD NOW MATCHES NEW CSV HEADERS ---
                    payload = {
                        "Subject": item.get('NEWSSUB'),       # Was 'Title'
                        "Category": item.get('CATEGORYNAME'),
                        "Stock_Code": str(item.get('SCRIP_CD')), # Was 'ScripID'
                        "Stock_Name": item.get('SLONGNAME'),     # Was 'CompanyName'
                        "Date_Time": item.get('NEWS_DT'),        # Was 'Time'
                        "PDF_URL": url,                          # Was 'URL'
                        "File_Hash_SHA256": fhash,               # Was 'FileHash'
                        "Text_Content": text                     # Was 'TextContent'
                    }

                    # 2. Save PDF Locally
                    local_pdf_path = None
                    if pdf_bytes and fhash != "N/A":
                        pdf_filename = f"{payload['Stock_Code']}_{fhash[:8]}.pdf"
                        local_pdf_path = os.path.join(REALTIME_TEXT_DIR, pdf_filename)
                        with open(local_pdf_path, "wb") as f:
                            f.write(pdf_bytes)

                    # 3. Save Metadata (Storage Engine)
                    self.storage.save_announcement(payload)

                    # 4. BROADCAST
                    self.broadcast(payload, local_pdf_path)

                    self.seen_ids.add(uid)

        except Exception as e:
            print(f"Error: {e}")

def run():
    bot = BSEBroadcaster()
    schedule.every(30).seconds.do(bot.check_updates)
    bot.check_updates()
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    run()