from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    EMPLOYEE = "employee"
    SECURITY_TEAM = "security_team"
    EXECUTIVE = "executive"
    ADMIN = "admin"

class IncidentType(str, Enum):
    MALWARE = "malware"
    PHISHING = "phishing"
    DATA_BREACH = "data_breach"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    SOCIAL_ENGINEERING = "social_engineering"
    PHYSICAL_SECURITY = "physical_security"

class IncidentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(str, Enum):
    PENDING = "pending"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    CLOSED = "closed"

# User Models (Firebase-based)
class UserProfile(BaseModel):
    uid: str  # Firebase UID
    email: EmailStr
    full_name: str
    role: UserRole
    department: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    department: Optional[str] = None
    phone_number: Optional[str] = None

# Incident Models (Firebase-based)
class IncidentBase(BaseModel):
    incident_type: IncidentType
    subject: str
    description: str
    severity: Optional[IncidentSeverity] = None
    location: Optional[Dict[str, Any]] = None

class IncidentCreate(IncidentBase):
    files: Optional[List[str]] = []

class IncidentResponse(IncidentBase):
    id: str
    status: IncidentStatus
    reporter_uid: str  # Firebase UID
    assigned_to: Optional[str] = None
    ai_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

# Message Models (Firebase-based)
class MessageCreate(BaseModel):
    incident_id: str
    content: str
    message_type: str = "text"

class MessageResponse(MessageCreate):
    id: str
    sender_uid: str  # Firebase UID
    sender_name: str
    created_at: datetime
    is_encrypted: bool = True

# Auth Models
class TokenData(BaseModel):
    uid: str
    email: str
    role: UserRole

class AuthResponse(BaseModel):
    message: str
    user_profile: UserProfile

# Test Models
class TestResponse(BaseModel):
    message: str
    timestamp: datetime
    status: str = "success"