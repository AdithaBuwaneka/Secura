from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.firebase_config import FirebaseConfig
from models.schemas import TokenData, UserRole
from typing import Optional

# Security scheme for Bearer token
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
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
    
    # Get user profile from Firestore
    uid = decoded_token.get('uid')
    user_profile = FirebaseConfig.get_user_by_uid(uid)
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    return TokenData(
        uid=uid,
        email=decoded_token.get('email'),
        role=UserRole(user_profile.get('role', 'employee'))
    )

async def require_role(required_role: UserRole):
    """Dependency to require specific role"""
    def role_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}"
            )
        return current_user
    return role_checker

async def require_roles(allowed_roles: list[UserRole]):
    """Dependency to require one of multiple roles"""
    def roles_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {allowed_roles}"
            )
        return current_user
    return roles_checker