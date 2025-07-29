#!/usr/bin/env python3
"""
Script to check user roles in the database
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.auth.auth_service import AuthService
import asyncio

async def check_user_roles():
    """Check all user roles in the database"""
    auth_service = AuthService()
    
    print("Checking user roles in database...")
    print("=" * 50)
    
    try:
        users = await auth_service.get_all_users()
        
        for user in users:
            print(f"User: {user.full_name}")
            print(f"  Email: {user.email}")
            print(f"  UID: {user.uid}")
            print(f"  Role: {user.role.value}")
            print(f"  Active: {user.is_active}")
            print("-" * 30)
        
        print(f"\nTotal users found: {len(users)}")
        
        # Check specific users
        security_lead = await auth_service.get_user_profile("a0K2XFG3BLaahuL0AGecdd0MrAB3")
        if security_lead:
            print(f"\nSecurity Lead found:")
            print(f"  Name: {security_lead.full_name}")
            print(f"  Role: {security_lead.role.value}")
        else:
            print("\nSecurity Lead NOT found in database")
            
        employee = await auth_service.get_user_profile("9uNAQi01DEhPqUWj5VA7z31vcbl1")
        if employee:
            print(f"\nEmployee found:")
            print(f"  Name: {employee.full_name}")
            print(f"  Role: {employee.role.value}")
        else:
            print("\nEmployee NOT found in database")
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_user_roles()) 