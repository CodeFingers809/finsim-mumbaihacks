import time
import schedule
import requests
import hashlib
import os
import json
import sys
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# --- TRY IMPORTING PYMUPDF ---
try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: PyMuPDF is not installed. Run: pip install pymupdf")
    sys.exit(1)

# Silence MuPDF errors
if hasattr(fitz, "TOOLS") and hasattr(fitz.TOOLS, "mupdf_display_errors"):
    fitz.TOOLS.mupdf_display_errors(False)

# --- CONFIGURATION ---
POLL_INTERVAL_MINUTES = 2   # How often to check (Don't go below 1 min)
STATE_FILE = "monitor_state.json" # Remembers what we've already seen
BASE_API_URL = "https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w"

# --- EVENT EMITTER (The "Hook") ---
def emit_new_announcement_event(payload):
    """
    THIS IS YOUR EMIT EVENT.
    Connect this to your Frontend, WebSocket, Slack, or DB.
    """
    print("\n" + "!"*50)
    print(f"🚨 NEW ALERT: {payload['Title']}")
    print(f"📄 Scrip: {payload['ScripID']} | 🔗 Hash: {payload['FileHash'][:8]}")
    print(f"📝 Text Snippet: {payload['TextContent'][:100]}...")
    print("!"*50 + "\n")
    
    # Example: If using Socket.IO
    # socketio.emit('new_corporate_action', payload)

# --- CORE MONITOR CLASS ---
class BSEMonitor:
    def __init__(self):
        self.seen_ids = self._load_state()
        self.session = self._create_session()
        print(f"Monitor initialized. Tracking {len(self.seen_ids)} historical records.")

    def _create_session(self):
        s = requests.Session()
        retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
        s.mount("https://", HTTPAdapter(max_retries=retries))
        s.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.bseindia.com/corporates/ann.html",
            "Origin": "https://www.bseindia.com"
        })
        # Prime cookies
        try: s.get("https://www.bseindia.com/corporates/ann.html", timeout=10)
        except: pass
        return s

    def _load_state(self):
        """Loads the set of processed IDs so we don't alert twice on restart."""
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, 'r') as f:
                    return set(json.load(f))
            except:
                return set()
        return set()

    def _save_state(self):
        """Saves processed IDs to disk."""
        try:
            with open(STATE_FILE, 'w') as f:
                # Convert set to list for JSON serialization
                json.dump(list(self.seen_ids), f)
        except Exception as e:
            print(f"Warning: Could not save state: {e}")

    def _get_unique_id(self, item):
        """Creates a unique ID for an announcement."""
        # Combination of Scrip Code + Time + Attachment Name ensures uniqueness
        raw = f"{item.get('SCRIP_CD')}{item.get('NEWS_DT')}{item.get('ATTACHMENTNAME')}"
        return hashlib.md5(raw.encode()).hexdigest()

    def download_and_extract(self, pdf_url):
        """Downloads PDF and extracts text using PyMuPDF."""
        if not pdf_url: return None, None

        try:
            r = self.session.get(pdf_url, timeout=15)
            if r.status_code != 200: return None, None
            
            pdf_bytes = r.content
            file_hash = hashlib.sha256(pdf_bytes).hexdigest()
            
            text = ""
            with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                for page in doc:
                    text += page.get_text() + "\n"
            
            if not text.strip(): text = "[Scanned Image/No Text]"
            
            return text, file_hash
        except Exception as e:
            return f"[Error: {e}]", None

    def check_for_updates(self):
        """The polling task."""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Checking BSE for new announcements...", end="")
        
        # Fetch mostly recent data (Today)
        now_str = datetime.now().strftime("%Y%m%d")
        
        params = {
            "strCat": "-1",
            "strPrevDate": now_str,
            "strScrip": "",
            "strSearch": "P",
            "strToDate": now_str,
            "strType": "C",
            "Pageno": "1" # Only check first page for "Real Time" updates
        }

        try:
            response = self.session.get(BASE_API_URL, params=params, timeout=15)
            if response.status_code != 200:
                print(f" API Error ({response.status_code})")
                return

            data = response.json()
            if not isinstance(data, dict) or "Table" not in data:
                print(" No Data.")
                return

            records = data["Table"]
            new_items = []

            # 1. Filter for NEW items
            for item in records:
                uid = self._get_unique_id(item)
                if uid not in self.seen_ids:
                    new_items.append((uid, item))

            print(f" Found {len(new_items)} new items.")

            # 2. Process NEW items
            # We process oldest first to maintain timeline order
            for uid, item in reversed(new_items):
                attachment = item.get('ATTACHMENTNAME')
                pdf_url = f"https://www.bseindia.com/xml-data/corpfiling/AttachLive/{attachment}" if attachment else None
                
                print(f"   > Processing: {item.get('SLONGNAME')}...")
                
                text_content, file_hash = self.download_and_extract(pdf_url)
                
                # Create the clean payload
                payload = {
                    "Title": item.get('NEWSSUB'),
                    "Category": item.get('CATEGORYNAME'),
                    "ScripID": item.get('SCRIP_CD'),
                    "CompanyName": item.get('SLONGNAME'),
                    "Time": item.get('NEWS_DT'),
                    "URL": pdf_url,
                    "FileHash": file_hash,
                    "TextContent": text_content
                }

                # 3. EMIT EVENT
                emit_new_announcement_event(payload)
                
                # 4. Update State
                self.seen_ids.add(uid)
            
            # Save state after batch processing
            if new_items:
                self._save_state()

        except Exception as e:
            print(f" Error: {e}")

# --- RUNNER ---
def run_scheduler():
    monitor = BSEMonitor()
    
    # Run once immediately
    monitor.check_for_updates()
    
    # Schedule regular checks
    schedule.every(POLL_INTERVAL_MINUTES).minutes.do(monitor.check_for_updates)
    
    print(f"--- Monitor Started (Polling every {POLL_INTERVAL_MINUTES} mins) ---")
    print("Press Ctrl+C to stop.")
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    run_scheduler()