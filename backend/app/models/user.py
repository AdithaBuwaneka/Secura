from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .common import UserRole

class UserProfile(BaseModel):
    uid: str
    email: EmailStr
    full_name: str
    role: UserRole
    department: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool = True

class UserCreate(BaseModel):
    uid: str  # Firebase UID from frontend
    email: EmailStr
    full_name: str
    role: UserRole
    department: Optional[str] = None
    phone_number: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None

class UserListResponse(BaseModel):
    users: list[UserProfile]
    total: int