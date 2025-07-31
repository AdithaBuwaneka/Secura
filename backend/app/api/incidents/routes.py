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
    # Validate that at least one of title or description is provided
    if (not incident_data.title or incident_data.title == "") and (not incident_data.description or incident_data.description == ""):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one of title or description must be provided"
        )
    
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

@router.get("/")
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
        
        # The service now returns dicts with attachments included
        # Just ensure enums are strings if they're still objects
        for incident in incidents:
            if isinstance(incident, dict):
                # Already a dict from the service
                if 'status' in incident and hasattr(incident['status'], 'value'):
                    incident['status'] = incident['status'].value
                if 'severity' in incident and hasattr(incident['severity'], 'value'):
                    incident['severity'] = incident['severity'].value
                if 'incident_type' in incident and hasattr(incident['incident_type'], 'value'):
                    incident['incident_type'] = incident['incident_type'].value
            else:
                # Convert to dict if it's still a Pydantic model
                incident_dict = incident.dict()
                if 'status' in incident_dict and hasattr(incident_dict['status'], 'value'):
                    incident_dict['status'] = incident_dict['status'].value
                if 'severity' in incident_dict and hasattr(incident_dict['severity'], 'value'):
                    incident_dict['severity'] = incident_dict['severity'].value
                if 'incident_type' in incident_dict and hasattr(incident_dict['incident_type'], 'value'):
                    incident_dict['incident_type'] = incident_dict['incident_type'].value
                incidents[incidents.index(incident)] = incident_dict
        
        return incidents
        
    except Exception as e:
        import traceback
        print(f"Error retrieving incidents: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve incidents: {str(e)}"
        )

@router.get("/{incident_id}")
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
            "status": updated_incident.get("status", "unknown"),
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
    assignment_data: dict,
    current_user: User = Depends(get_current_user),
    incident_service: IncidentService = Depends()
):
    """
    Assign incident to security team member
    Role-based permissions:
    - Team Leader (security.lead@secura.com): Can assign to anyone
    - Security Team Members: Can only assign to themselves
    - Admin: Can assign to anyone
    """
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only security team can assign incidents"
        )
    
    try:
        assignee_id = assignment_data.get("assignee_id")
        if not assignee_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="assignee_id is required"
            )
        
        # Check role-based assignment permissions
        is_team_leader = current_user.email == "security.lead@secura.com"
        is_admin = current_user.role.value == "admin"
        
        # Regular team members can only assign to themselves
        if not is_team_leader and not is_admin:
            if assignee_id != current_user.uid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Team members can only assign incidents to themselves"
                )
        
        # Get the current incident to check if it's already assigned
        current_incident = await incident_service.get_incident(incident_id)
        if current_incident.get('assigned_to') and current_incident.get('assigned_to') != current_user.uid:
            # Only team leader and admin can reassign incidents assigned to others
            if not is_team_leader and not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only team leaders can reassign incidents from other members"
                )
        
        incident = await incident_service.assign_incident(
            incident_id, assignee_id, current_user.uid
        )
        
        # Send real-time notification to assignee
        await manager.send_to_user(assignee_id, json.dumps({
            "type": "incident_assigned",
            "incident_id": incident_id,
            "title": incident.get("title", "Untitled Incident"),
            "assigned_by": current_user.full_name
        }))
        
        return {"message": "Incident assigned successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign incident: {str(e)}"
        )

@router.post("/{incident_id}/unassign")
async def unassign_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    incident_service: IncidentService = Depends()
):
    """
    Unassign incident (remove assignee)
    Role-based permissions:
    - Team Leader: Can unassign any incident
    - Team Members: Can only unassign incidents assigned to themselves
    - Admin: Can unassign any incident
    """
    if current_user.role.value not in ["security_team", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only security team can unassign incidents"
        )
    
    try:
        # Check role-based unassignment permissions
        is_team_leader = current_user.email == "security.lead@secura.com"
        is_admin = current_user.role.value == "admin"
        
        # Get the current incident to check assignment
        current_incident = await incident_service.get_incident(incident_id)
        
        # Regular team members can only unassign incidents assigned to themselves
        if not is_team_leader and not is_admin:
            if current_incident.get('assigned_to') != current_user.uid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Team members can only unassign incidents assigned to themselves"
                )
        
        incident = await incident_service.unassign_incident(incident_id, current_user.uid)
        
        return {"message": "Incident unassigned successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unassign incident: {str(e)}"
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
    current_user: User = Depends(get_current_user),
    file_service: FileService = Depends()
):
    """
    Upload file attachment to incident (Max 10MB)
    """
    try:
        print(f"Uploading attachment for incident {incident_id}")
        print(f"File: {file.filename}, Size: {file.size}, Type: {file.content_type}")
        
        # Validate file size (10MB limit)
        if file.size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 10MB limit"
            )
        
        # Upload file using ImageKit
        attachment = await file_service.upload_file(
            file=file,
            incident_id=incident_id,
            uploader_id=current_user.uid
        )
        
        print(f"File uploaded successfully: {attachment}")
        
        return {
            "message": "File uploaded successfully",
            "attachment": attachment.dict() if hasattr(attachment, 'dict') else attachment
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