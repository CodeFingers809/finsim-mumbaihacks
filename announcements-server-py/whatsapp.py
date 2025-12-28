import requests
import os

# --- CONFIGURATION ---
WHATSAPP_SERVER_URL = "http://localhost:4001/send"

class WhatsAppClient:
    def __init__(self, server_url=WHATSAPP_SERVER_URL):
        self.server_url = server_url

    def send_alert(self, user_phone, payload, pdf_path=None):
        """
        Sends a WhatsApp alert using the new payload structure.
        """
        
        # CHANGED: Updated keys to match new naming convention
        message_body = (
            f"*🚨 NEW BSE ANNOUNCEMENT 🚨*\n\n"
            f"*Company:* {payload['Stock_Name']} ({payload['Stock_Code']})\n"
            f"*Category:* {payload['Category']}\n"
            f"*Subject:* {payload['Subject']}\n"
            f"*Time:* {payload['Date_Time']}\n\n"
            f"🔗 *Link:* {payload['PDF_URL']}\n\n"
            f"*Summary Snippet:*\n"
            f"{payload['Text_Content'][:300]}..." 
        )

        try:
            # 2. Check if we have a PDF to attach
            if pdf_path and os.path.exists(pdf_path):
                print(f"   📤 Sending PDF to {user_phone}...")
                
                with open(pdf_path, 'rb') as f:
                    files = {
                        'media': (os.path.basename(pdf_path), f, 'application/pdf')
                    }
                    data = {
                        'toNumber': user_phone,
                        'caption': message_body,
                        'mediaType': 'document'
                    }
                    
                    response = requests.post(self.server_url, data=data, files=files)
            else:
                # 3. Fallback to Text Only
                print(f"   📤 Sending Text to {user_phone}...")
                json_payload = {
                    "toNumber": user_phone,
                    "text": message_body
                }
                response = requests.post(self.server_url, json=json_payload)

            if response.status_code == 200:
                print(f"   ✅ WhatsApp delivered to {user_phone}")
                return True
            else:
                print(f"   ❌ WhatsApp Failed: {response.text}")
                return False

        except Exception as e:
            print(f"   ❌ Connection Error to WhatsApp Server: {e}")
            return False