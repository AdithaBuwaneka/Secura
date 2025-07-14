from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from models.user import UserCreate, UserProfile, UserListResponse, UserUpdate
from models.auth import TokenData
from models.common import UserRole
from utils.auth import get_current_user, require_roles
from core.firebase_config import FirebaseConfig

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=UserProfile)
async def register_user(user_data: UserCreate):
    """Register new user - creates user profile in Firestore"""
    try:
        db = FirebaseConfig.get_firestore()
        
        # Check if user already exists in Firestore
        existing_user = db.collection('users').document(user_data.uid).get()
        if existing_user.exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User profile already exists"
            )
        
        # Create user profile in Firestore
        user_profile = {
            'uid': user_data.uid,
            'email': user_data.email,
            'full_name': user_data.full_name,
            'role': user_data.role.value,
            'department': user_data.department,
            'phone_number': user_data.phone_number,
            'created_at': datetime.now(),
            'last_login': None,
            'is_active': True
        }
        
        # Save to Firestore
        db.collection('users').document(user_data.uid).set(user_profile)
        
        return UserProfile(**user_profile)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user profile: {str(e)}"
        )

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: TokenData = Depends(get_current_user)):
    """Get current user's profile"""
    try:
        db = FirebaseConfig.get_firestore()
        user_doc = db.collection('users').document(current_user.uid).get()
        
        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        user_data = user_doc.to_dict()
        # Update last login
        db.collection('users').document(current_user.uid).update({
            'last_login': datetime.now()
        })
        
        return UserProfile(**user_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}"
        )

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    update_data: UserUpdate,
    current_user: TokenData = Depends(get_current_user)
):
    """Update current user's profile"""
    try:
        db = FirebaseConfig.get_firestore()
        
        # Convert to dict and filter None values
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        if update_dict:
            update_dict['updated_at'] = datetime.now()
            
            # Update in Firestore
            db.collection('users').document(current_user.uid).update(update_dict)
        
        # Get updated profile
        updated_doc = db.collection('users').document(current_user.uid).get()
        return UserProfile(**updated_doc.to_dict())
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user profile: {str(e)}"
        )

@router.get("/all", response_model=UserListResponse)
async def get_all_users(
    current_user: TokenData = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_TEAM]))
):
    """Get all users - Admin and Security Team only"""
    try:
        db = FirebaseConfig.get_firestore()
        users_ref = db.collection('users')
        users = []
        
        for doc in users_ref.stream():
            user_data = doc.to_dict()
            users.append(UserProfile(**user_data))
        
        return UserListResponse(users=users, total=len(users))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get users: {str(e)}"
        )

@router.post("/verify-token")
async def verify_token(current_user: TokenData = Depends(get_current_user)):
    """Verify if token is valid and return user info"""
    return {
        "valid": True,
        "user": {
            "uid": current_user.uid,
            "email": current_user.email,
            "role": current_user.role
        }
    }