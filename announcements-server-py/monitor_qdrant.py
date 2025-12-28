"""
Enhanced BSE Monitor with Qdrant storage and user matching.
"""

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
from qdrant_storage import QdrantAnnouncementStore
from user_manager import UserManager
from whatsapp import WhatsAppClient

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
POLL_INTERVAL_MINUTES = 2
STATE_FILE = "monitor_state.json"
BASE_API_URL = "https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w"

# --- NOTIFY FRONTEND ---
NEXTJS_NOTIFY_URL = os.getenv("NEXTJS_NOTIFY_URL", "http://localhost:3000/api/alerts/send")


class BSEMonitorWithQdrant:
    def __init__(self):
        self.seen_ids = self._load_state()
        self.session = self._create_session()
        self.qdrant_store = QdrantAnnouncementStore()
        self.user_manager = UserManager()
        self.whatsapp = WhatsAppClient()
        print(f"Monitor initialized. Tracking {len(self.seen_ids)} historical records.")

    def _create_session(self):
        s = requests.Session()
        retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
        s.mount("https://", HTTPAdapter(max_retries=retries))
        s.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.bseindia.com/corporates/ann.html",
            "Origin": "https://www.bseindia.com"
        })
        try:
            s.get("https://www.bseindia.com/corporates/ann.html", timeout=10)
        except:
            pass
        return s

    def _load_state(self):
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, 'r') as f:
                    return set(json.load(f))
            except:
                return set()
        return set()

    def _save_state(self):
        try:
            with open(STATE_FILE, 'w') as f:
                json.dump(list(self.seen_ids), f)
        except Exception as e:
            print(f"Warning: Could not save state: {e}")

    def _get_unique_id(self, item):
        raw = f"{item.get('SCRIP_CD')}{item.get('NEWS_DT')}{item.get('ATTACHMENTNAME')}"
        return hashlib.md5(raw.encode()).hexdigest()

    def download_and_extract(self, pdf_url):
        if not pdf_url:
            return None, None

        try:
            r = self.session.get(pdf_url, timeout=15)
            if r.status_code != 200:
                return None, None
            
            pdf_bytes = r.content
            file_hash = hashlib.sha256(pdf_bytes).hexdigest()
            
            text = ""
            with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                for page in doc:
                    text += page.get_text() + "\n"
            
            if not text.strip():
                text = "[Scanned Image/No Text]"
            
            return text, file_hash
        except Exception as e:
            return f"[Error: {e}]", None

    def notify_frontend(self, announcement_data, matched_users):
        """
        Notify Next.js frontend about matched announcement.
        Frontend will handle WhatsApp sending.
        """
        try:
            payload = {
                "announcement": announcement_data,
                "matched_users": matched_users,
            }
            
            response = requests.post(
                NEXTJS_NOTIFY_URL,
                json=payload,
                timeout=10
            )
            
            if response.ok:
                print(f"   📤 Notified frontend about {len(matched_users)} matches")
            else:
                print(f"   ⚠️  Frontend notification failed: {response.text}")
        except Exception as e:
            print(f"   ⚠️  Could not reach frontend: {e}")

    def _hydrate_user_contacts(self, matched_users):
        if not matched_users:
            return matched_users

        user_preferences = self.user_manager.get_all_users()
        hydrated = []

        for user in matched_users:
            user_id = user.get("userId")
            phone = user.get("phoneNumber")
            if not phone:
                phone = user_preferences.get(user_id, {}).get("phoneNumber")

            hydrated.append({**user, "phoneNumber": phone})

        return hydrated

    def check_for_updates(self):
        """Main polling task with Qdrant integration"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Checking BSE...", end="")
        
        now_str = datetime.now().strftime("%Y%m%d")
        
        params = {
            "strCat": "-1",
            "strPrevDate": now_str,
            "strScrip": "",
            "strSearch": "P",
            "strToDate": now_str,
            "strType": "C",
            "Pageno": "1"
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

            for item in records:
                uid = self._get_unique_id(item)
                if uid not in self.seen_ids:
                    new_items.append((uid, item))

            print(f" Found {len(new_items)} new items.")

            for uid, item in reversed(new_items):
                attachment = item.get('ATTACHMENTNAME')
                pdf_url = f"https://www.bseindia.com/xml-data/corpfiling/AttachLive/{attachment}" if attachment else None
                
                print(f"\n   📋 Processing: {item.get('SLONGNAME')}...")
                
                text_content, file_hash = self.download_and_extract(pdf_url)
                
                if not text_content or len(text_content.strip()) < 50:
                    print(f"   ⏭️  Skipping (no text content)")
                    self.seen_ids.add(uid)
                    continue

                # Prepare metadata
                metadata = {
                    "stock_code": item.get('SCRIP_CD'),
                    "stock_name": item.get('SLONGNAME'),
                    "category": item.get('CATEGORYNAME'),
                    "subject": item.get('NEWSSUB'),
                    "date_time": item.get('NEWS_DT'),
                    "pdf_url": pdf_url,
                    "file_hash": file_hash,
                }

                # 1. Store in Qdrant
                try:
                    point_id = self.qdrant_store.store_announcement(
                        text=text_content,
                        metadata=metadata
                    )
                except Exception as e:
                    print(f"   ❌ Qdrant storage failed: {e}")
                    self.seen_ids.add(uid)
                    continue

                # 2. Find matching users
                try:
                    matched_users = self.qdrant_store.find_matching_users(
                        announcement_text=text_content,
                        stock_code=metadata["stock_code"],
                        category=metadata["category"]
                    )
                    matched_users = self._hydrate_user_contacts(matched_users)
                except Exception as e:
                    print(f"   ❌ User matching failed: {e}")
                    matched_users = []

                # 3. Notify frontend if there are matches
                if matched_users:
                    announcement_data = {
                        "title": metadata["subject"],
                        "company": metadata["stock_name"],
                        "stock_code": metadata["stock_code"],
                        "category": metadata["category"],
                        "time": metadata["date_time"],
                        "url": metadata["pdf_url"],
                        "text_snippet": text_content[:500],
                    }
                    
                    self.notify_frontend(announcement_data, matched_users)
                else:
                    print(f"   ℹ️  No matching users")

                # 4. Update state
                self.seen_ids.add(uid)
            
            if new_items:
                self._save_state()

        except Exception as e:
            print(f" Error: {e}")


def run_scheduler():
    monitor = BSEMonitorWithQdrant()
    
    # Run once immediately
    monitor.check_for_updates()
    
    # Schedule regular checks
    schedule.every(POLL_INTERVAL_MINUTES).minutes.do(monitor.check_for_updates)
    
    print(f"\n--- Monitor Started (Polling every {POLL_INTERVAL_MINUTES} mins) ---")
    print("Press Ctrl+C to stop.\n")
    
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    run_scheduler()
