"""
Incident Management API Routes - Jayasanka's Module
Handles CRUD operations, real-time communication, and file attachments
"""

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, WebSocket, WebSocketDisconnect
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.models.incident import IncidentResponse, IncidentCreate, IncidentUpdate, IncidentStatus
from app.models.message import Message, MessageCreate
from app.services.incidents.incident_service import IncidentService
from app.services.incidents.messaging_service import MessagingService
from app.services.incidents.file_service import FileService
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(tags=["Incident Management"])

# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket

    def disconnect(self, websocket: WebSocket, user_id: str):
        self.active_connections.remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

    async def send_to_user(self, user_id: str, message: str):
        if user_id in self.user_connections:
            await self.user_connections[user_id].send_text(message)

manager = ConnectionManager()

@router.post("/", response_model=IncidentResponse)
async def create_incident(
    incident_data: IncidentCreate,
    current_user: User = Depends(get_current_user),
    incident_service: IncidentService = Depends()
):
    """
    Create a new security incident report
    Available to all authenticated users
    """
    try:
        # Create incident with user information
        incident = await incident_service.create_incident(
            incident_data, 
            reporter_id=current_user.uid,
            reporter_email=current_user.email,
            reporter_name=current_user.full_name,
            reporter_department=getattr(current_user, 'department', None)
        )
        
        # Broadcast real-time notification to security team
        await manager.broadcast(json.dumps({
            "type": "new_incident",
            "incident_id": incident.id,
            "title": incident.title,
            "severity": incident.severity.value,
            "reporter": current_user.full_name
        }))
        
        return incident
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create incident: {str(e)}"
        )

@router.get("/", response_model=List[IncidentResponse])
async def get_incidents(
    status_filter: Optional[IncidentStatus] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    incident_service: IncidentService = Depends()
):
    """
    Get incidents based on user role:
    - Employees: Only their own incidents
    - Security Team: All incidents
    - Admin: All incidents with additional filters
    """
    try:
        if current_user.role.value == "employee":
            # Employees can only see their own incidents
            incidents = await incident_service.get_user_incidents(
                current_user.uid, status_filter, limit, offset
            )
        else:
            # Security team and admin can see all incidents
            incidents = await incident_service.get_all_incidents(
                status_filter, limit, offset
            )
        
        return incidents
        
    except Exception as e:
        print(f"ERROR in get_incidents: {str(e)}")
        print(f"ERROR type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve incidents: {str(e)}"
        )

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    incident_service: IncidentService = Depends()
):
    """
    Get specific incident details
    """
    try:
        incident = await incident_service.get_incident(incident_id)
        
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found"
            )
        
        # Check permissions
        if (current_user.role.value == "employee" and 
            incident.reporter_id != current_user.uid):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this incident"
            )
        
        return incident
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve incident: {str(e)}"
        )

@router.put("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    incident_data: IncidentUpdate,
    current_user: User = Depends(get_current_user),
    incident_service: IncidentService = Depends()
):
    """
    Update incident details
    - Employees: Can update their own incidents if status is 'open'
    - Security Team: Can update any incident
    - Admin: Can update any incident
    """
    try:
        incident = await incident_service.get_incident(incident_id)
        
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found"
            )
        
        # Check permissions
        if current_user.role.value == "employee":
            if (incident.reporter_id != current_user.uid or 
                incident.status != IncidentStatus.PENDING):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot modify this incident"
                )
        
        updated_incident = await incident_service.update_incident(
            incident_id, incident_data, current_user.uid
        )
        
        # Broadcast real-time update
        await manager.broadcast(json.dumps({
            "type": "incident_updated",
            "incident_id": incident_id,
            "status": updated_incident.status.value,
            "updated_by": current_user.full_name
        }))
        
        return updated_incident
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update incident: {str(e)}"
        )

@router.post("/{incident_id}/assign")
async def assign_incident(
    incident_id: str,
    assignee_id: str,
    current_user: User = Depends(get_current_user),
    incident_service: IncidentService = Depends()
):
    """
    Assign incident to security team member
    Security Team and Admin only
    """
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only security team can assign incidents"
        )
    
    try:
        incident = await incident_service.assign_incident(
            incident_id, assignee_id, current_user.uid
        )
        
        # Send real-time notification to assignee
        await manager.send_to_user(assignee_id, json.dumps({
            "type": "incident_assigned",
            "incident_id": incident_id,
            "title": incident.title,
            "assigned_by": current_user.full_name
        }))
        
        return {"message": "Incident assigned successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign incident: {str(e)}"
        )

@router.post("/{incident_id}/messages", response_model=Message)
async def send_message(
    incident_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    messaging_service: MessagingService = Depends()
):
    """
    Send secure message for incident communication
    """
    try:
        message = await messaging_service.send_message(
            incident_id=incident_id,
            sender_id=current_user.uid,
            sender_name=current_user.full_name,
            sender_role=current_user.role.value,
            content=message_data.content,
            message_type=message_data.message_type
        )
        
        # Broadcast real-time message
        await manager.broadcast(json.dumps({
            "type": "new_message",
            "incident_id": incident_id,
            "message_id": message.id,
            "sender": current_user.full_name,
            "content": message_data.content
        }))
        
        return message
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )

@router.get("/{incident_id}/messages", response_model=List[Message])
async def get_messages(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    messaging_service: MessagingService = Depends()
):
    """
    Get all messages for an incident
    """
    try:
        # Check if user has access to incident
        incident_service = IncidentService()
        incident = await incident_service.get_incident(incident_id)
        
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found"
            )
        
        if (current_user.role.value == "employee" and 
            incident.reporter_id != current_user.uid):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to incident messages"
            )
        
        messages = await messaging_service.get_incident_messages(incident_id)
        return messages
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve messages: {str(e)}"
        )

@router.post("/{incident_id}/attachments")
async def upload_attachment(
    incident_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload file attachment to incident (Max 10MB)
    """
    try:
        print(f"DEBUG: File upload attempt - filename: {file.filename}, size: {file.size}, content_type: {file.content_type}")
        
        # Validate file size (10MB limit)
        if file.size and file.size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 10MB limit"
            )
        
        # Create file service instance
        file_service = FileService()
        
        # Upload file using ImageKit
        print(f"DEBUG: Uploading file to ImageKit for incident {incident_id}")
        attachment = await file_service.upload_file(
            file=file,
            incident_id=incident_id,
            uploader_id=current_user.uid
        )
        
        print(f"DEBUG: File upload result: {attachment}")
        
        return {
            "message": "File uploaded successfully",
            "attachment": attachment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time incident updates
    """
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Process incoming WebSocket messages if needed
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)