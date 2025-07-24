from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .common import MessageType

class MessageCreate(BaseModel):
    incident_id: str
    content: str
    message_type: MessageType = MessageType.TEXT

class MessageUpdate(BaseModel):
    content: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    incident_id: str
    sender_uid: str
    sender_name: str
    content: str
    message_type: MessageType
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_encrypted: bool = True

class Message(BaseModel):
    id: str
    incident_id: str
    sender_id: str
    sender_name: str
    content: str
    message_type: MessageType
    created_at: datetime
    is_read: bool = False
    encrypted: bool = False
    read_by: Optional[str] = None
    read_at: Optional[datetime] = None

class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    total: int
    incident_id: str