import os
import csv
from config import REALTIME_TEXT_DIR, REALTIME_CSV_PATH

class StorageEngine:
    def __init__(self):
        # Initialize CSV if it doesn't exist
        if not os.path.exists(REALTIME_CSV_PATH):
            with open(REALTIME_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                # Matches your new headers
                writer.writerow(["Stock_Code", "Stock_Name", "Category", "Subject", "Date_Time", "File_Hash_SHA256", "Text_Filename", "PDF_URL"])

    def save_announcement(self, data_payload):
        """
        Saves metadata to CSV and text content to .txt file.
        """
        try:
            # 1. Save Text Content
            # CHANGED: Accessing new key names
            file_hash = data_payload['File_Hash_SHA256']
            stock_code = data_payload['Stock_Code']
            
            filename = f"{stock_code}_{file_hash[:8]}.txt"
            file_path = os.path.join(REALTIME_TEXT_DIR, filename)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(data_payload['Text_Content']) # CHANGED

            # 2. Append to CSV
            with open(REALTIME_CSV_PATH, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                # CHANGED: Mapping new keys to the CSV columns
                writer.writerow([
                    data_payload['Stock_Code'],
                    data_payload['Stock_Name'],
                    data_payload['Category'],
                    data_payload['Subject'],
                    data_payload['Date_Time'],
                    file_hash,
                    filename,
                    data_payload['PDF_URL']
                ])
                
            return True
        except Exception as e:
            print(f"❌ Storage Error: {e}")
            return False