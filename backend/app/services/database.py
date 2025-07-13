from core.firebase_config import FirebaseConfig
from datetime import datetime
import uuid

class DatabaseService:
    def __init__(self):
        self.db = FirebaseConfig.get_firestore()
    
    async def test_connection(self):
        """Test Firestore connection"""
        try:
            # Create a test document
            test_doc = {
                'test': True,
                'timestamp': datetime.now(),
                'message': 'Secura database connection successful'
            }
            
            doc_ref = self.db.collection('test').document('connection_test')
            doc_ref.set(test_doc)
            
            # Read it back
            doc = doc_ref.get()
            if doc.exists:
                return {"status": "success", "data": doc.to_dict()}
            else:
                return {"status": "error", "message": "Test document not found"}
                
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def initialize_collections(self):
        """Initialize required collections with proper structure"""
        collections = [
            'users', 'incidents', 'messages', 
            'notifications', 'analytics', 'audit_logs', 
            'mitigation_strategies'
        ]
        
        results = {}
        for collection in collections:
            try:
                # Create a sample document to initialize collection
                sample_doc = {
                    'initialized': True,
                    'created_at': datetime.now(),
                    'collection_name': collection
                }
                
                self.db.collection(collection).document('_init').set(sample_doc)
                results[collection] = "initialized"
                
            except Exception as e:
                results[collection] = f"error: {str(e)}"
        
        return results

# Create instance
db_service = DatabaseService()