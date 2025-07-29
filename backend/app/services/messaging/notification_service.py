"""
Role-based Notification Service
Handles sending notifications to appropriate user roles
"""

from typing import Dict, List, Optional, Any
from app.services.messaging.connection_manager import ConnectionManager
from app.models.common import UserRole
import json

class NotificationService:
    def __init__(self, connection_manager: ConnectionManager):
        self.manager = connection_manager
        # Store user roles for filtering
        self.user_roles: Dict[str, str] = {}
    
    def register_user_role(self, user_id: str, role: str):
        """Register a user's role for notification filtering"""
        self.user_roles[user_id] = role
    
    def unregister_user(self, user_id: str):
        """Remove user from role tracking"""
        if user_id in self.user_roles:
            del self.user_roles[user_id]
    
    async def send_incident_notification(self, incident_data: Dict[str, Any], notification_type: str = "new_incident"):
        """Send incident notifications based on user roles"""
        
        if notification_type == "new_incident":
            # New incidents: Only send to Security Team and Admin
            await self._send_to_roles(
                message=json.dumps({
                    "type": "new_incident",
                    "incident_id": incident_data.get("incident_id"),
                    "title": incident_data.get("title"),
                    "severity": incident_data.get("severity"),
                    "reporter": incident_data.get("reporter")
                }),
                allowed_roles=["security_team", "admin"]
            )
            
        elif notification_type == "incident_update":
            # Incident updates: Send to relevant parties
            await self._send_incident_update_notification(incident_data)
            
        elif notification_type == "incident_assigned":
            # Assignment: Send to assignee and admin
            await self._send_to_roles(
                message=json.dumps({
                    "type": "incident_assigned",
                    "incident_id": incident_data.get("incident_id"),
                    "title": incident_data.get("title"),
                    "assigned_by": incident_data.get("assigned_by")
                }),
                allowed_roles=["security_team", "admin"]
            )
    
    async def send_message_notification(self, message_data: Dict[str, Any]):
        """Send message notifications based on context"""
        sender_role = self.user_roles.get(message_data.get("sender_id"), "employee")
        
        if sender_role in ["security_team", "admin"]:
            # Security team/admin message: Send to employee
            await self._send_to_user(
                message=json.dumps({
                    "type": "notification",
                    "sender_id": message_data.get("sender_id"),
                    "sender_name": message_data.get("sender_name"),
                    "message": "New message from security team"
                }),
                user_id=message_data.get("recipient_id")
            )
        else:
            # Employee message: Send to security team and admin
            await self._send_to_roles(
                message=json.dumps({
                    "type": "notification",
                    "sender_id": message_data.get("sender_id"),
                    "sender_name": message_data.get("sender_name"),
                    "message": f"New message from {message_data.get('sender_name')}"
                }),
                allowed_roles=["security_team", "admin"]
            )
    
    async def send_security_alert(self, alert_data: Dict[str, Any]):
        """Send security alerts to appropriate roles"""
        severity = alert_data.get("severity", "medium")
        
        if severity in ["critical", "high"]:
            # Critical/High alerts: Send to all roles
            await self._send_to_roles(
                message=json.dumps({
                    "type": "security_alert",
                    "title": alert_data.get("title"),
                    "message": alert_data.get("message"),
                    "severity": severity
                }),
                allowed_roles=["employee", "security_team", "admin"]
            )
        else:
            # Medium/Low alerts: Send to security team and admin only
            await self._send_to_roles(
                message=json.dumps({
                    "type": "security_alert",
                    "title": alert_data.get("title"),
                    "message": alert_data.get("message"),
                    "severity": severity
                }),
                allowed_roles=["security_team", "admin"]
            )
    
    async def send_system_notification(self, notification_data: Dict[str, Any]):
        """Send system notifications based on type"""
        notification_type = notification_data.get("type", "general")
        
        if notification_type == "user_management":
            # User management: Admin only
            await self._send_to_roles(
                message=json.dumps({
                    "type": "system_message",
                    "message": notification_data.get("message")
                }),
                allowed_roles=["admin"]
            )
        elif notification_type == "system_health":
            # System health: Admin and security team
            await self._send_to_roles(
                message=json.dumps({
                    "type": "system_message",
                    "message": notification_data.get("message")
                }),
                allowed_roles=["security_team", "admin"]
            )
        else:
            # General system notifications: All roles
            await self._send_to_roles(
                message=json.dumps({
                    "type": "system_message",
                    "message": notification_data.get("message")
                }),
                allowed_roles=["employee", "security_team", "admin"]
            )
    
    async def _send_incident_update_notification(self, incident_data: Dict[str, Any]):
        """Send incident updates to relevant parties"""
        incident_id = incident_data.get("incident_id")
        reporter_id = incident_data.get("reporter_id")
        assignee_id = incident_data.get("assignee_id")
        
        # Send to reporter (employee)
        if reporter_id and reporter_id in self.manager.active_connections:
            await self.manager.send_personal_message(
                json.dumps({
                    "type": "incident_update",
                    "incident_id": incident_id,
                    "status": incident_data.get("status"),
                    "message": f"Your incident {incident_id} has been updated"
                }),
                reporter_id
            )
        
        # Send to assignee (security team)
        if assignee_id and assignee_id in self.manager.active_connections:
            await self.manager.send_personal_message(
                json.dumps({
                    "type": "incident_update",
                    "incident_id": incident_id,
                    "status": incident_data.get("status"),
                    "message": f"Incident {incident_id} status updated"
                }),
                assignee_id
            )
        
        # Send to admin
        await self._send_to_roles(
            message=json.dumps({
                "type": "incident_update",
                "incident_id": incident_id,
                "status": incident_data.get("status")
            }),
            allowed_roles=["admin"]
        )
    
    async def _send_to_roles(self, message: str, allowed_roles: List[str]):
        """Send message to users with specific roles"""
        for user_id, connection in self.manager.active_connections.items():
            user_role = self.user_roles.get(user_id, "employee")
            if user_role in allowed_roles:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"Failed to send role-based notification to {user_id}: {str(e)}")
    
    async def _send_to_user(self, message: str, user_id: str):
        """Send message to specific user"""
        if user_id in self.manager.active_connections:
            try:
                await self.manager.active_connections[user_id].send_text(message)
            except Exception as e:
                print(f"Failed to send notification to {user_id}: {str(e)}")
    
    def get_user_role(self, user_id: str) -> str:
        """Get user's role"""
        return self.user_roles.get(user_id, "employee")