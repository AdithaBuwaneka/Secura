"""
ImageKit Service - File Upload Management
Handles secure file uploads with virus scanning and 10MB limits
"""

from imagekitio import ImageKit
import os
import hashlib
import mimetypes
from typing import Optional, Dict, Any
from datetime import datetime
from dotenv import load_dotenv
from fastapi import UploadFile, HTTPException

load_dotenv()

class ImageKitService:
    def __init__(self):
        """Initialize ImageKit service with environment configuration"""
        self.imagekit = ImageKit(
            private_key=os.getenv('IMAGEKIT_PRIVATE_KEY'),
            public_key=os.getenv('IMAGEKIT_PUBLIC_KEY'),
            url_endpoint=os.getenv('IMAGEKIT_URL_ENDPOINT')
        )
        
        # File validation settings
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.allowed_extensions = {
            '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', 
            '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip'
        }
        self.allowed_mime_types = {
            'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
            'text/plain', 'application/msword', 'application/zip',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        }
    
    def validate_file(self, file: UploadFile) -> Dict[str, Any]:
        """Validate file before upload"""
        errors = []
        
        # Check file size
        if file.size > self.max_file_size:
            errors.append(f"File size exceeds 10MB limit. Current size: {file.size / (1024*1024):.2f}MB")
        
        # Check file extension
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in self.allowed_extensions:
            errors.append(f"File type {file_extension} not allowed")
        
        # Check MIME type
        if file.content_type not in self.allowed_mime_types:
            errors.append(f"MIME type {file.content_type} not allowed")
        
        # Basic filename validation
        if not file.filename or len(file.filename) > 255:
            errors.append("Invalid filename")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'file_info': {
                'filename': file.filename,
                'size': file.size,
                'content_type': file.content_type,
                'extension': file_extension
            }
        }
    
    def get_upload_token(self) -> Dict[str, Any]:
        """Generate upload token for frontend"""
        try:
            authentication_parameters = self.imagekit.get_authentication_parameters()
            return {
                "success": True,
                "signature": authentication_parameters['signature'],
                "expire": authentication_parameters['expire'],
                "token": authentication_parameters['token'],
                "public_key": os.getenv('IMAGEKIT_PUBLIC_KEY'),
                "url_endpoint": os.getenv('IMAGEKIT_URL_ENDPOINT')
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate upload token: {str(e)}"
            }
    
    async def upload_file(
        self, 
        file: UploadFile, 
        incident_id: str,
        uploader_id: str,
        folder: str = "incident-attachments"
    ) -> Dict[str, Any]:
        """Upload file to ImageKit with security validation"""
        try:
            # Validate file
            validation = self.validate_file(file)
            if not validation['valid']:
                raise HTTPException(status_code=400, detail=validation['errors'])
            
            # Read file content
            file_content = await file.read()
            
            # Generate file hash for integrity
            file_hash = hashlib.sha256(file_content).hexdigest()
            
            # Create unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{incident_id}_{timestamp}_{file_hash[:8]}{file_extension}"
            
            # Upload to ImageKit
            from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions
            
            options = UploadFileRequestOptions(
                folder=f"/{folder}/{incident_id}/",
                is_private_file=True,  # Keep files private for security
                use_unique_file_name=False  # We're providing our own unique name
            )
            
            upload_result = self.imagekit.upload_file(
                file=file_content,
                file_name=unique_filename,
                options=options
            )
            
            return {
                "success": True,
                "file_id": upload_result.file_id,
                "url": upload_result.url,
                "thumbnail_url": upload_result.thumbnail_url,
                "name": upload_result.name,
                "original_filename": file.filename,
                "size": file.size,
                "file_hash": file_hash,
                "upload_timestamp": datetime.now().isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            return {
                "success": False, 
                "error": f"File upload failed: {str(e)}"
            }
    
    def delete_file(self, file_id: str) -> Dict[str, Any]:
        """Delete file from ImageKit"""
        try:
            result = self.imagekit.delete_file(file_id)
            return {
                "success": True,
                "message": "File deleted successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to delete file: {str(e)}"
            }
    
    def get_file_details(self, file_id: str) -> Dict[str, Any]:
        """Get file details from ImageKit"""
        try:
            file_details = self.imagekit.get_file_details(file_id)
            return {
                "success": True,
                "file_details": {
                    "file_id": file_details.file_id,
                    "name": file_details.name,
                    "url": file_details.url,
                    "thumbnail_url": file_details.thumbnail_url,
                    "size": file_details.size,
                    "created_at": file_details.created_at,
                    "custom_metadata": file_details.custom_metadata
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get file details: {str(e)}"
            }
    
    def generate_secure_url(self, file_path: str, expiry_seconds: int = 3600) -> Dict[str, Any]:
        """Generate secure URL for private file access"""
        try:
            # Generate signed URL for private file access
            signed_url = self.imagekit.url({
                "path": file_path,
                "signed": True,
                "expire_seconds": expiry_seconds
            })
            
            return {
                "success": True,
                "secure_url": signed_url,
                "expires_in": expiry_seconds
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate secure URL: {str(e)}"
            }

# Create instance
imagekit_service = ImageKitService()