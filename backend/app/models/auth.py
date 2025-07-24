from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .common import UserRole

class TokenData(BaseModel):
    uid: str
    email: str
    role: UserRole

class UserRegistration(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    department: Optional[str] = None

class UserLogin(BaseModel):
    id_token: str  # Firebase ID token from frontend

class UserProfile(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None

class TokenVerification(BaseModel):
    id_token: str

class AuthResponse(BaseModel):
    message: str
    user_profile: dict
    access_token: str  # Firebase ID token

class TokenVerificationResponse(BaseModel):
    valid: bool
    user: dict