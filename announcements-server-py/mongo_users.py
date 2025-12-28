"""
Mongo-backed user store for alert preferences.
"""

from typing import Dict, Any

from pymongo import MongoClient

from config import MONGODB_URI, MONGODB_DB, MONGODB_USERS_COLLECTION


class MongoUserStore:
    def __init__(self):
        if not MONGODB_URI:
            raise ValueError("MONGODB_URI is not configured")

        self.client = MongoClient(MONGODB_URI)
        self.collection = self.client[MONGODB_DB][MONGODB_USERS_COLLECTION]

    def fetch_user_preferences(self) -> Dict[str, Dict[str, Any]]:
        """
        Returns a mapping keyed by Clerk user id with filters + phone number.
        """
        preferences: Dict[str, Dict[str, Any]] = {}

        cursor = self.collection.find(
            {},
            {
                "clerkId": 1,
                "phoneNumber": 1,
                "filters": 1,
            },
        )

        for doc in cursor:
            user_id = doc.get("clerkId") or str(doc.get("_id"))
            filters = doc.get("filters") or {}
            preferences[user_id] = {
                "phoneNumber": doc.get("phoneNumber"),
                "scrips": filters.get("scrips", []),
                "categories": filters.get("categories", []),
                "keywords": filters.get("keywords", []),
            }

        return preferences


if __name__ == "__main__":
    store = MongoUserStore()
    data = store.fetch_user_preferences()
    print(f"Loaded {len(data)} users from MongoDB")
    for uid, prefs in data.items():
        print(uid, prefs)
