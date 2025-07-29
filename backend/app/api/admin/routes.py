"""
Admin API Routes - User Management
Handles admin-only operations for user management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from app.models.auth import UserProfile
from app.models.common import UserRole
from app.services.auth.auth_service import AuthService
from app.utils.auth import get_current_user
from app.models.user import User
from app.utils.logging import log_admin_action, log_security_event
from firebase_admin import auth as firebase_auth

router = APIRouter()

@router.get("/test")
async def test_admin_route():
    """Test endpoint to verify admin routes are working"""
    return {"message": "Admin routes are working!", "status": "ok"}

@router.get("/users", response_model=List[dict])
async def get_all_users(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends()
):
    """
    Get all users (Admin only)
    Returns list of all users in the system
    """
    print(f"Admin route called by user: {current_user.email} with role: {current_user.role}")
    
    # Check if current user is admin
    if current_user.role != UserRole.ADMIN:
        print(f"Access denied: User {current_user.email} is not admin")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access user management"
        )
    
    try:
        print("Fetching all users from database...")
        users = await auth_service.get_all_users()
        print(f"Found {len(users)} users in database")
        
        # Convert to response format
        user_list = []
        for user in users:
            user_data = {
                "uid": user.uid,
                "email": user.email,
                "full_name": user.full_name,
                "phone_number": user.phone_number,
                "role": user.role.value,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
            user_list.append(user_data)
        
        print(f"Returning {len(user_list)} users")
        return user_list
        
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@router.patch("/users/{uid}/role")
async def update_user_role(
    uid: str,
    role_data: dict,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends()
):
    """
    Update user role (Admin only)
    Changes user role between employee and security_team
    """
    # Check if current user is admin
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can modify user roles"
        )
    
    # Prevent admin from modifying their own role
    if uid == current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own role"
        )
    
    new_role = role_data.get("role")
    if new_role not in ["employee", "security_team"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'employee' or 'security_team'"
        )
    
    try:
        # Get the target user
        target_user = await auth_service.get_user_profile(uid)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent modifying admin roles
        if target_user.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify admin roles"
            )
        
        # Update the role
        if new_role == "security_team":
            success = await auth_service.assign_security_role(uid)
        else:
            success = await auth_service.remove_security_role(uid)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user role"
            )
        
        # Get updated user
        updated_user = await auth_service.get_user_profile(uid)
        
        # Log admin action
        log_admin_action(
            admin_email=current_user.email,
            action="user_role_change",
            target_user=updated_user.email,
            details=f"Role changed from {target_user.role.value} to {new_role}"
        )
        
        return {
            "message": f"User role updated to {new_role}",
            "user": {
                "uid": updated_user.uid,
                "email": updated_user.email,
                "full_name": updated_user.full_name,
                "phone_number": updated_user.phone_number,
                "role": updated_user.role.value,
                "is_active": updated_user.is_active,
                "created_at": updated_user.created_at.isoformat() if updated_user.created_at else None,
                "last_login": updated_user.last_login.isoformat() if updated_user.last_login else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user role: {str(e)}"
        )

@router.patch("/users/{uid}/status")
async def update_user_status(
    uid: str,
    status_data: dict,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends()
):
    """
    Update user status (Admin only)
    Activates or deactivates user accounts
    """
    # Check if current user is admin
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can modify user status"
        )
    
    # Prevent admin from modifying their own status
    if uid == current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own status"
        )
    
    is_active = status_data.get("is_active")
    if not isinstance(is_active, bool):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="is_active must be a boolean value"
        )
    
    try:
        # Get the target user
        target_user = await auth_service.get_user_profile(uid)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user status in Firestore
        await auth_service.update_user_status(uid, is_active)
        
        # Get updated user
        updated_user = await auth_service.get_user_profile(uid)
        
        # Log admin action
        log_admin_action(
            admin_email=current_user.email,
            action="user_status_change",
            target_user=updated_user.email,
            details=f"User {'activated' if is_active else 'deactivated'}"
        )
        
        return {
            "message": f"User {'activated' if is_active else 'deactivated'} successfully",
            "user": {
                "uid": updated_user.uid,
                "email": updated_user.email,
                "full_name": updated_user.full_name,
                "phone_number": updated_user.phone_number,
                "role": updated_user.role.value,
                "is_active": updated_user.is_active,
                "created_at": updated_user.created_at.isoformat() if updated_user.created_at else None,
                "last_login": updated_user.last_login.isoformat() if updated_user.last_login else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user status: {str(e)}"
        )

@router.post("/users/create-security-member")
async def create_security_member(
    member_data: dict,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends()
):
    """
    Create a new security team member (Admin only)
    Creates both Firebase auth account and user profile
    """
    # Check if current user is admin
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create security team members"
        )
    
    required_fields = ['email', 'full_name', 'phone_number', 'password']
    for field in required_fields:
        if not member_data.get(field):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required field: {field}"
            )
    
    try:
        # Check if user already exists in Firebase
        try:
            existing_user = firebase_auth.get_user_by_email(member_data['email'])
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        except firebase_auth.UserNotFoundError:
            # Good, user doesn't exist yet
            pass
        
        # Create Firebase user
        firebase_user = firebase_auth.create_user(
            email=member_data['email'],
            password=member_data['password'],
            display_name=member_data['full_name']
        )
        
        # Create user profile in Firestore with security_team role
        profile_data = {
            'uid': firebase_user.uid,
            'email': member_data['email'],
            'full_name': member_data['full_name'],
            'phone_number': member_data['phone_number'],
            'role': 'security_team',
            'is_active': True,
            'created_at': datetime.utcnow(),
            'created_by': current_user.uid
        }
        
        # Save to Firestore
        from app.core.firebase_config import FirebaseConfig
        db = FirebaseConfig.get_firestore()
        db.collection('users').document(firebase_user.uid).set(profile_data)
        
        # Log admin action
        log_admin_action(
            admin_email=current_user.email,
            action="create_security_member",
            target_user=member_data['email'],
            details=f"New security team member created: {member_data['full_name']}"
        )
        
        # Log security event
        log_security_event(
            user_email=current_user.email,
            event_type="new_security_member",
            description=f"New security team member created: {member_data['email']}",
            level="info"
        )
        
        return {
            "message": "Security team member created successfully",
            "user": {
                "uid": firebase_user.uid,
                "email": member_data['email'],
                "full_name": member_data['full_name'],
                "phone_number": member_data['phone_number'],
                "role": "security_team",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # If we created Firebase user but failed to create profile, clean up
        try:
            if 'firebase_user' in locals():
                firebase_auth.delete_user(firebase_user.uid)
        except:
            pass
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create security team member: {str(e)}"
        ) 