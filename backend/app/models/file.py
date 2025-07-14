from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FileUploadResponse(BaseModel):
    success: bool
    file_id: Optional[str] = None
    url: Optional[str] = None
    name: Optional[str] = None
    error: Optional[str] = None

class FileMetadata(BaseModel):
    file_id: str
    original_name: str
    file_name: str
    file_size: int
    content_type: str
    url: str
    uploaded_by: str
    uploaded_at: datetime
    incident_id: Optional[str] = None

class UploadTokenResponse(BaseModel):
    signature: str
    expire: int
    token: str