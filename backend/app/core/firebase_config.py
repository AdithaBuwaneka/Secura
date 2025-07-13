import firebase_admin
from firebase_admin import credentials, firestore, auth
# Remove storage import
import os
from dotenv import load_dotenv

load_dotenv()

class FirebaseConfig:
    _db = None
    
    @classmethod
    def initialize_firebase(cls):
        if not firebase_admin._apps:
            # Create credentials from environment variables
            cred_dict = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
                "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
            }
            
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        
        cls._db = firestore.client()
        return cls._db
    
    @classmethod
    def get_firestore(cls):
        if cls._db is None:
            cls.initialize_firebase()
        return cls._db

# Initialize Firebase when module is imported (no storage)
firebase_db = FirebaseConfig.initialize_firebase()