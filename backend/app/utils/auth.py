from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.firebase_config import FirebaseConfig
from app.models.auth import TokenData
from app.models.common import UserRole
from app.models.user import User
from app.services.auth.auth_service import AuthService
from typing import List

# Security scheme for Bearer token
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Verify Firebase ID token and return user data"""
    
    # Extract token from Authorization header
    id_token = credentials.credentials
    
    # Verify token with Firebase
    decoded_token = FirebaseConfig.verify_id_token(id_token)
    
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user profile from Firestore using AuthService
    uid = decoded_token.get('uid')
    auth_service = AuthService()
    user_profile = await auth_service.get_user_profile(uid)
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Update last login timestamp
    await auth_service.update_last_login(uid)
    
    return user_profile

def require_role(required_role: UserRole):
    """Dependency to require specific role"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}"
            )
        return current_user
    return role_checker

def require_roles(allowed_roles: List[UserRole]):
    """Dependency to require one of multiple roles"""
    def roles_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {allowed_roles}"
            )
        return current_user
    return roles_checker