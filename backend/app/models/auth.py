from pydantic import BaseModel, EmailStr
from .common import UserRole

class TokenData(BaseModel):
    uid: str
    email: str
    role: UserRole

class LoginRequest(BaseModel):
    id_token: str  # Firebase ID token from frontend

class AuthResponse(BaseModel):
    message: str
    user_profile: dict
    access_token: str  # Firebase ID token

class TokenVerificationResponse(BaseModel):
    valid: bool
    user: dict