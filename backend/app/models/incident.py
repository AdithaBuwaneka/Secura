from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from .common import IncidentType, IncidentSeverity, IncidentStatus

class IncidentLocation(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

class IncidentBase(BaseModel):
    incident_type: IncidentType
    subject: str
    description: str
    severity: Optional[IncidentSeverity] = None
    location: Optional[IncidentLocation] = None

class IncidentCreate(IncidentBase):
    files: Optional[List[str]] = []

class IncidentUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    assigned_to: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: str
    status: IncidentStatus
    reporter_uid: str
    reporter_name: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    ai_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    files: List[str] = []
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

class IncidentListResponse(BaseModel):
    incidents: List[IncidentResponse]
    total: int
    page: int
    per_page: int

class IncidentStats(BaseModel):
    total_incidents: int
    pending: int
    investigating: int
    resolved: int
    closed: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]