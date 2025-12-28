from user_manager import UserManager

def create_test_data():
    um = UserManager()

    print("--- Creating Test Users based on your Screenshot data ---")

    # 1. POSITIVE MATCH: This user wants EXACTLY what is in your screenshot.
    #    Target: "Insider Trading / SAST" category AND "Closure of Trading Window"
    um.add_user("test_user_insider", {
        "scrips": [],  # All companies
        "categories": ["Insider Trading / SAST"], # Matches the category in your image
        "keywords": ["Closure of Trading Window"] # Matches the title in your image
    })

    # 2. SPECIFIC SCRIP MATCH: This user tracks 'Greenpanel Industries' (542857)
    #    Target: Any announcement from Scrip 542857
    um.add_user("test_user_greenpanel", {
        "scrips": ["542857"], # Greenpanel Industries Ltd
        "categories": [],
        "keywords": []
    })

    # 3. NEGATIVE CONTROL: This user should NOT get an alert.
    #    Target: Only wants "Dividends" (Your screenshot has none)
    um.add_user("test_user_dividend_only", {
        "scrips": [],
        "categories": ["Dividend"],
        "keywords": ["Dividend", "Bonus"]
    })

    print("\n✅ Test users created in 'user_subscriptions.json'")
    print("----------------------------------------------------")
    print("1. 'test_user_insider' -> Should receive ALERT (Category match)")
    print("2. 'test_user_greenpanel' -> Should receive ALERT (Scrip match)")
    print("3. 'test_user_dividend_only' -> Should receive NOTHING (No match)")

if __name__ == "__main__":
    create_test_data()