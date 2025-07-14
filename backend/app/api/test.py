from fastapi import APIRouter, Depends
from datetime import datetime
from models.common import TestResponse
from models.auth import TokenData
from utils.auth import get_current_user
from core.firebase_config import FirebaseConfig

router = APIRouter(prefix="/test", tags=["test"])

@router.get("/", response_model=TestResponse)
async def test_endpoint():
    """Basic test endpoint"""
    return TestResponse(
        message="Secura API is running with Firebase-only auth!",
        status="success",
        timestamp=datetime.now()
    )

@router.get("/firebase")
async def test_firebase():
    """Test Firebase connection"""
    try:
        db = FirebaseConfig.get_firestore()
        
        if db:
            # Test writing to Firestore
            test_doc = {
                'test': True,
                'timestamp': datetime.now(),
                'message': 'Firebase connection successful'
            }
            
            # Write test document
            db.collection('test').document('connection_test').set(test_doc)
            
            return {
                "status": "success",
                "message": "Firebase connected and Firestore working",
                "timestamp": datetime.now()
            }
        else:
            return {
                "status": "error",
                "message": "Firebase connection failed",
                "timestamp": datetime.now()
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Firebase error: {str(e)}",
            "timestamp": datetime.now()
        }

@router.get("/auth")
async def test_auth(current_user: TokenData = Depends(get_current_user)):
    """Test authentication with Firebase ID token"""
    return {
        "message": "Authentication successful!",
        "user": {
            "uid": current_user.uid,
            "email": current_user.email,
            "role": current_user.role
        },
        "timestamp": datetime.now()
    }