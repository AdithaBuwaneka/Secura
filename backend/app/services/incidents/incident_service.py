"""
Incident Service - Jayasanka's Module
Handles CRUD operations for security incidents
"""

from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from app.models.incident import IncidentCreate, IncidentUpdate, IncidentResponse, IncidentStatus, IncidentSeverity
from app.core.firebase_config import FirebaseConfig


class IncidentService:
    def __init__(self):
        self.db = FirebaseConfig.get_firestore()
        self.incidents_collection = self.db.collection('incidents')

    async def create_incident(
        self, 
        incident_data: IncidentCreate, 
        reporter_id: str,
        reporter_email: str,
        reporter_name: str = None,
        reporter_department: str = None
    ) -> IncidentResponse:
        """Create a new security incident"""
        incident_id = str(uuid4())
        
        incident_doc = {
            'id': incident_id,
            'title': incident_data.title,
            'incident_type': incident_data.incident_type.value if incident_data.incident_type else None,
            'description': incident_data.description,
            'severity': incident_data.severity.value if incident_data.severity else IncidentSeverity.LOW.value,
            'status': IncidentStatus.PENDING.value,
            'reporter_id': reporter_id,
            'reporter_name': reporter_name or 'Unknown',
            'reporter_email': reporter_email,
            'reporter_department': reporter_department,
            'assigned_to': None,
            'assigned_to_name': None,
            'assigned_at': None,
            'assigned_by': None,
            'ai_analysis': None,
            'location': incident_data.location.dict() if incident_data.location else None,
            'attachments': incident_data.attachments or [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'resolved_at': None,
            'closed_at': None,
            'additional_context': incident_data.additional_context or {},
            'last_activity': datetime.utcnow(),
            'priority_score': None
        }
        
        self.incidents_collection.document(incident_id).set(incident_doc)
        
        return IncidentResponse(**incident_doc)

    async def create_incident_with_id(
        self, 
        incident_id: str,
        incident_data: IncidentCreate, 
        reporter_id: str,
        reporter_email: str,
        reporter_name: str = None,
        reporter_department: str = None
    ) -> IncidentResponse:
        """Create a new security incident with a specific ID"""
        incident_doc = {
            'id': incident_id,
            'title': incident_data.title,
            'incident_type': incident_data.incident_type.value if incident_data.incident_type else None,
            'description': incident_data.description,
            'severity': incident_data.severity.value if incident_data.severity else IncidentSeverity.LOW.value,
            'status': IncidentStatus.PENDING.value,
            'reporter_id': reporter_id,
            'reporter_name': reporter_name or 'Unknown',
            'reporter_email': reporter_email,
            'reporter_department': reporter_department,
            'assigned_to': None,
            'assigned_to_name': None,
            'assigned_at': None,
            'assigned_by': None,
            'ai_analysis': None,
            'location': incident_data.location.dict() if incident_data.location else None,
            'attachments': incident_data.attachments or [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'resolved_at': None,
            'closed_at': None,
            'additional_context': incident_data.additional_context or {},
            'last_activity': datetime.utcnow(),
            'priority_score': None
        }
        
        self.incidents_collection.document(incident_id).set(incident_doc)
        
        return IncidentResponse(**incident_doc)

    async def get_incident(self, incident_id: str) -> Optional[IncidentResponse]:
        """Get incident by ID"""
        doc = self.incidents_collection.document(incident_id).get()
        
        if not doc.exists:
            return None
        
        data = doc.to_dict()
        return IncidentResponse(**data)

    async def get_all_incidents(
        self, 
        status_filter: Optional[IncidentStatus] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[IncidentResponse]:
        """Get all incidents (Security Team/Admin view)"""
        try:
            query = self.incidents_collection
                
            # Add status filter if provided
            if status_filter:
                query = query.where('status', '==', status_filter.value)
            
            # Don't use order_by to avoid potential index issues
            # We'll sort in Python instead
            docs = query.limit(limit * 2).stream()  # Get more docs to sort
            
            incidents = []
            for doc in docs:
                data = doc.to_dict()
                # Ensure required fields have defaults
                if 'created_at' not in data:
                    data['created_at'] = datetime.utcnow()
                if 'updated_at' not in data:
                    data['updated_at'] = datetime.utcnow()
                incidents.append(IncidentResponse(**data))
            
            # Sort by created_at in Python (newest first)
            incidents.sort(key=lambda x: x.created_at, reverse=True)
            
            # Apply offset and limit after sorting
            start = offset
            end = offset + limit
            return incidents[start:end]
            
        except Exception as e:
            print(f"Error in get_all_incidents: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            # Return empty list instead of raising to prevent 500 errors
            return []

    async def get_user_incidents(
        self, 
        user_id: str,
        status_filter: Optional[IncidentStatus] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[IncidentResponse]:
        """Get incidents for specific user (Employee view)"""
        try:
            # Start with basic user filter
            query = self.incidents_collection.where('reporter_id', '==', user_id)
            
            # Add status filter if provided
            if status_filter:
                query = query.where('status', '==', status_filter.value)
            
            # Don't use order_by to avoid composite index requirement
            # We'll sort in Python instead
            docs = query.limit(limit * 2).stream()  # Get more docs to sort
            
            incidents = []
            for doc in docs:
                data = doc.to_dict()
                # Ensure required fields have defaults
                if 'created_at' not in data:
                    data['created_at'] = datetime.utcnow()
                if 'updated_at' not in data:
                    data['updated_at'] = datetime.utcnow()
                incidents.append(IncidentResponse(**data))
            
            # Sort by created_at in Python (newest first)
            incidents.sort(key=lambda x: x.created_at, reverse=True)
            
            # Apply offset and limit after sorting
            start = offset
            end = offset + limit
            return incidents[start:end]
            
        except Exception as e:
            print(f"Error in get_user_incidents: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            # Return empty list instead of raising to prevent 500 errors
            return []

    async def update_incident(
        self, 
        incident_id: str, 
        incident_data: IncidentUpdate,
        updated_by: str
    ) -> IncidentResponse:
        """Update incident details"""
        update_data = {
            'updated_at': datetime.utcnow(),
            'updated_by': updated_by
        }
        
        if incident_data.title:
            update_data['title'] = incident_data.title
        if incident_data.description:
            update_data['description'] = incident_data.description
        if incident_data.severity:
            update_data['severity'] = incident_data.severity.value
        if incident_data.status:
            update_data['status'] = incident_data.status.value
            if incident_data.status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                update_data['resolved_at'] = datetime.utcnow()
        if incident_data.assigned_to:
            update_data['assigned_to'] = incident_data.assigned_to
        
        self.incidents_collection.document(incident_id).update(update_data)
        
        return await self.get_incident(incident_id)

    async def assign_incident(
        self, 
        incident_id: str, 
        assignee_id: str,
        assigned_by: str
    ) -> IncidentResponse:
        """Assign incident to security team member"""
        update_data = {
            'assigned_to': assignee_id,
            'status': IncidentStatus.INVESTIGATING.value,
            'updated_at': datetime.utcnow(),
            'assigned_by': assigned_by
        }
        
        self.incidents_collection.document(incident_id).update(update_data)
        
        return await self.get_incident(incident_id)

    async def update_ai_analysis(
        self, 
        incident_id: str, 
        ai_category: str, 
        ai_confidence: float,
        suggested_severity: IncidentSeverity = None
    ) -> IncidentResponse:
        """Update incident with AI analysis results"""
        update_data = {
            'ai_category': ai_category,
            'ai_confidence': ai_confidence,
            'updated_at': datetime.utcnow()
        }
        
        if suggested_severity:
            update_data['severity'] = suggested_severity.value
        
        self.incidents_collection.document(incident_id).update(update_data)
        
        return await self.get_incident(incident_id)