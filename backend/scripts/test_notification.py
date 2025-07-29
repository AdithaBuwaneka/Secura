#!/usr/bin/env python3
"""
Script to test the notification system
"""
import sys
import os
import asyncio
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.messaging.connection_manager import ConnectionManager
from app.services.messaging.notification_service import NotificationService

async def test_notification():
    """Test the notification system"""
    print("Testing notification system...")
    
    # Create connection manager and notification service
    manager = ConnectionManager()
    notification_service = NotificationService(manager)
    
    # Register test users with roles
    notification_service.register_user_role("9uNAQi01DEhPqUWj5VA7z31vcbl1", "employee")
    notification_service.register_user_role("a0K2XFG3BLaahuL0AGecdd0MrAB3", "security_team")
    
    print("Registered users:")
    print(f"  Employee (9uNAQi01DEhPqUWj5VA7z31vcbl1): {notification_service.get_user_role('9uNAQi01DEhPqUWj5VA7z31vcbl1')}")
    print(f"  Security Lead (a0K2XFG3BLaahuL0AGecdd0MrAB3): {notification_service.get_user_role('a0K2XFG3BLaahuL0AGecdd0MrAB3')}")
    
    # Test incident notification
    print("\nSending test incident notification...")
    await notification_service.send_incident_notification({
        "incident_id": "TEST-2024-001",
        "title": "Test Security Incident",
        "severity": "high",
        "reporter": "Test Employee"
    }, "new_incident")
    
    print("Test notification sent!")
    print("Check if security lead receives the notification in their browser.")

if __name__ == "__main__":
    asyncio.run(test_notification()) 