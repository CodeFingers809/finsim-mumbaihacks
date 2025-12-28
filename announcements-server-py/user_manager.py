import json
import os
from typing import Dict, Any

from config import (
    SUBSCRIPTION_FILE,
    MONGODB_URI,
)
from mongo_users import MongoUserStore

class UserManager:
    def __init__(self):
        self.file_path = SUBSCRIPTION_FILE
        self.mongo_store = None
        if MONGODB_URI:
            try:
                self.mongo_store = MongoUserStore()
            except Exception as exc:
                print(f"Warning: Mongo user store unavailable: {exc}")
        self.users = self._load_users()

    def _load_users(self) -> Dict[str, Any]:
        if self.mongo_store:
            try:
                mongo_users = self.mongo_store.fetch_user_preferences()
                if mongo_users:
                    print(f"Loaded {len(mongo_users)} users from MongoDB")
                    return mongo_users
            except Exception as exc:
                print(f"Warning: Failed to load from MongoDB: {exc}")

        if os.path.exists(self.file_path):
            with open(self.file_path, 'r') as f:
                return json.load(f)
        return {}

    def save_users(self):
        with open(self.file_path, 'w') as f:
            json.dump(self.users, f, indent=4)

    def add_user(self, user_id, preferences):
        """
        preferences = {
            "scrips": ["500325", "532540"], # Empty list = All Scrips
            "categories": ["Board Meeting"], # Empty list = All Categories
            "keywords": ["Bonus", "Split"]   # Empty list = No keyword filter
        }
        """
        self.users[user_id] = preferences
        self.save_users()
        print(f"✅ User '{user_id}' added/updated.")

    def refresh_from_mongo(self) -> Dict[str, Any]:
        """Force refresh users from MongoDB if configured."""
        if not self.mongo_store:
            return self.users

        try:
            self.users = self.mongo_store.fetch_user_preferences()
        except Exception as exc:
            print(f"Warning: refresh_from_mongo failed: {exc}")
        return self.users

    def get_all_users(self):
        return self.users

# --- EXAMPLE USAGE (Run this once to create test users) ---
if __name__ == "__main__":
    um = UserManager()
    
    # User 1: Wants EVERYTHING related to Reliance (500325)
    um.add_user("trader_1", {
        "scrips": ["500325"], 
        "categories": [],
        "keywords": []
    })
    
    # User 2: Wants ONLY "Dividend" announcements for ANY company
    um.add_user("dividend_hunter", {
        "scrips": [],
        "categories": [],
        "keywords": ["Dividend"]
    })

    # User 3: Wants "Board Meetings" for Tata Motors (500570)
    um.add_user("tata_fan", {
        "scrips": ["500570"],
        "categories": ["Board Meeting"],
        "keywords": []
    })
    
    print("Test users created in user_subscriptions.json")