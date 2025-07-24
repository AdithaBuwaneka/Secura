"""
Authentication Service - Aditha's Module
Handles Firebase Auth integration and user management
"""

from typing import Optional, List
from firebase_admin import auth, firestore
from datetime import datetime

from app.models.user import User, UserRole
from app.models.auth import UserProfile
from app.core.firebase_config import FirebaseConfig

class AuthService:
    def __init__(self):
        self.db = FirebaseConfig.get_firestore()
        self.users_collection = self.db.collection('users')

    async def create_user_profile(self, user: User) -> User:
        """Create user profile in Firestore"""
        user_data = {
            'uid': user.uid,
            'email': user.email,
            'full_name': user.full_name,
            'department': user.department,
            'role': user.role.value,
            'is_active': user.is_active,
            'created_at': datetime.utcnow(),
            'last_login': None
        }
        
        self.users_collection.document(user.uid).set(user_data)
        return user

    async def get_user_profile(self, uid: str) -> Optional[User]:
        """Get user profile from Firestore"""
        doc = self.users_collection.document(uid).get()
        
        if not doc.exists:
            return None
        
        data = doc.to_dict()
        return User(
            uid=data['uid'],
            email=data['email'],
            full_name=data['full_name'],
            department=data['department'],
            role=UserRole(data['role']),
            is_active=data['is_active'],
            created_at=data['created_at'],
            last_login=data.get('last_login')
        )

    async def update_user_profile(self, uid: str, profile_data: UserProfile) -> User:
        """Update user profile"""
        update_data = {
            'full_name': profile_data.full_name,
            'department': profile_data.department,
            'updated_at': datetime.utcnow()
        }
        
        self.users_collection.document(uid).update(update_data)
        return await self.get_user_profile(uid)

    async def assign_security_role(self, uid: str) -> bool:
        """Add user to security team"""
        try:
            self.users_collection.document(uid).update({
                'role': UserRole.SECURITY_TEAM.value,
                'updated_at': datetime.utcnow()
            })
            return True
        except Exception:
            return False

    async def remove_security_role(self, uid: str) -> bool:
        """Remove user from security team"""
        try:
            self.users_collection.document(uid).update({
                'role': UserRole.EMPLOYEE.value,
                'updated_at': datetime.utcnow()
            })
            return True
        except Exception:
            return False

    async def get_all_users(self) -> List[User]:
        """Get all users (Admin only)"""
        docs = self.users_collection.stream()
        users = []
        
        for doc in docs:
            data = doc.to_dict()
            users.append(User(
                uid=data['uid'],
                email=data['email'],
                full_name=data['full_name'],
                department=data['department'],
                role=UserRole(data['role']),
                is_active=data['is_active'],
                created_at=data['created_at'],
                last_login=data.get('last_login')
            ))
        
        return users

    async def update_last_login(self, uid: str):
        """Update user's last login timestamp"""
        self.users_collection.document(uid).update({
            'last_login': datetime.utcnow()
        })