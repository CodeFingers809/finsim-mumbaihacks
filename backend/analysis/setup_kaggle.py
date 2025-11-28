import json
import os

# ================= INPUTS =================
# 1. Enter your Kaggle Username (From your profile URL: kaggle.com/USERNAME)
KAGGLE_USERNAME = "ayushbohra123" 

# 2. Enter the hex part of the token you got (without 'KGAT_')
# Based on what you sent, it is likely:
KAGGLE_KEY = "134e19fb2ae4bb77c161fdf0eb5b9efe"
# ==========================================

# Define the Kaggle config path
kaggle_dir = os.path.expanduser("~/.kaggle")
os.makedirs(kaggle_dir, exist_ok=True)
config_path = os.path.join(kaggle_dir, "kaggle.json")

# Create the JSON content
data = {
    "username": KAGGLE_USERNAME,
    "key": KAGGLE_KEY
}

# Write the file
with open(config_path, "w") as f:
    json.dump(data, f)

# Set permissions (Required by Kaggle API)
os.chmod(config_path, 0o600)

print(f"✅ Created {config_path}")
print("You are ready to run the pipeline!")