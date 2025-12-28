import os
from dotenv import load_dotenv

load_dotenv()

# --- PATHS ---
BASE_DIR = "bse_data"

# 1. New Real-Time Data Storage
REALTIME_DIR = os.path.join(BASE_DIR, "realtime_announcements")
REALTIME_TEXT_DIR = os.path.join(REALTIME_DIR, "text_content")
REALTIME_CSV_PATH = os.path.join(REALTIME_DIR, "realtime_metadata.csv")

# 2. Historical Data (Existing)
HISTORICAL_DIR = BASE_DIR 
# (This assumes your bulk CSVs are in bse_data root)

# Ensure directories exist
os.makedirs(REALTIME_TEXT_DIR, exist_ok=True)

# --- USER PREFERENCES FILE ---
SUBSCRIPTION_FILE = "user_subscriptions.json"

# --- USER STORE (MongoDB) ---
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB", "brnch-htf")
MONGODB_USERS_COLLECTION = os.getenv("MONGODB_USERS_COLLECTION", "users")

# --- BACKEND INTEGRATION ---
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
BACKEND_ALERT_ENDPOINT = f"{BACKEND_URL}/api/alerts/send"
