"""
Authentication API Routes - Aditha's Module
Handles Firebase Auth integration, role-based access control, and user management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from typing import Optional

from app.models.auth import UserRegistration, UserLogin, UserProfile, TokenVerification
from app.models.user import User, UserRole
from app.services.auth.auth_service import AuthService
from app.services.database import DatabaseService
from app.utils.auth import get_current_user

router = APIRouter(tags=["Authentication"])
security = HTTPBearer()

@router.post("/register")
async def register_user(
    user_data: UserRegistration,
    auth_service: AuthService = Depends()
):
    """
    Register new user with Firebase Auth
    - Creates Firebase user account
    - Stores user profile in Firestore
    - Assigns default employee role
    """
    try:
        # Create Firebase user
        firebase_user = auth.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.full_name
        )
        
        # Create user profile in Firestore
        user_profile = User(
            uid=firebase_user.uid,
            email=user_data.email,
            full_name=user_data.full_name,
            department=user_data.department,
            role=UserRole.EMPLOYEE,  # Default role
            is_active=True
        )
        
        await auth_service.create_user_profile(user_profile)
        
        return {
            "message": "User registered successfully",
            "uid": firebase_user.uid,
            "email": user_data.email
        }
        
    except auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/verify-token")
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Verify Firebase ID token and return user information
    """
    try:
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(credentials.credentials)
        uid = decoded_token['uid']
        
        # Get user profile from Firestore
        auth_service = AuthService()
        user_profile = await auth_service.get_user_profile(uid)
        
        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return {
            "uid": uid,
            "email": decoded_token.get('email'),
            "role": user_profile.role,
            "department": user_profile.department,
            "is_active": user_profile.is_active
        }
        
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token verification failed: {str(e)}"
        )

@router.get("/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's profile information
    """
    return {
        "uid": current_user.uid,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "department": current_user.department,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }

@router.put("/profile")
async def update_user_profile(
    profile_data: UserProfile,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends()
):
    """
    Update user's profile information
    """
    try:
        updated_user = await auth_service.update_user_profile(
            current_user.uid, 
            profile_data
        )
        
        return {
            "message": "Profile updated successfully",
            "user": updated_user
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )

@router.post("/admin/manage-security-team")
async def manage_security_team(
    user_uid: str,
    action: str,  # "add" or "remove"
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends()
):
    """
    Admin-only: Add or remove users from security team
    """
    # Check if current user is admin
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        if action == "add":
            await auth_service.assign_security_role(user_uid)
            message = "User added to security team"
        elif action == "remove":
            await auth_service.remove_security_role(user_uid)
            message = "User removed from security team"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action. Use 'add' or 'remove'"
            )
        
        return {"message": message}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Security team management failed: {str(e)}"
        )

@router.get("/admin/users")
async def list_users(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends()
):
    """
    Admin-only: List all users in the system
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        users = await auth_service.get_all_users()
        return {"users": users}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve users: {str(e)}"
        )