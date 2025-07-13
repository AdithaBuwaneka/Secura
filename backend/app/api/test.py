from fastapi import APIRouter
from services.database import db_service
from services.imagekit_service import imagekit_service

router = APIRouter(prefix="/test", tags=["test"])

@router.get("/database")
async def test_database():
    """Test database connection"""
    result = await db_service.test_connection()
    return result

@router.post("/initialize")
async def initialize_database():
    """Initialize all required collections"""
    result = await db_service.initialize_collections()
    return {"message": "Database initialization completed", "results": result}

@router.get("/imagekit")
async def test_imagekit():
    """Test ImageKit service"""
    try:
        token_result = imagekit_service.get_upload_token()
        return {"status": "success", "imagekit_configured": True, "token_generated": "token" in token_result}
    except Exception as e:
        return {"status": "error", "message": str(e)}