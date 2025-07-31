"""
Cloudinary Configuration
Handles image upload and management
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class CloudinaryConfig:
    def __init__(self):
        self.cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
        self.api_key = os.getenv('CLOUDINARY_API_KEY')
        self.api_secret = os.getenv('CLOUDINARY_API_SECRET')
        
        # Check if credentials are available
        if not all([self.cloud_name, self.api_key, self.api_secret]):
            print("⚠️  Warning: Cloudinary credentials not found in environment variables")
            print("   Profile picture upload functionality will be disabled")
            print("   To enable it, set the following environment variables:")
            print("   - CLOUDINARY_CLOUD_NAME")
            print("   - CLOUDINARY_API_KEY") 
            print("   - CLOUDINARY_API_SECRET")
            self.is_configured = False
        else:
            # Configure Cloudinary
            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret
            )
            self.is_configured = True
            print("✅ Cloudinary configured successfully")
    
    async def upload_image(self, file_data: bytes, public_id: str, folder: str = "secura_profiles") -> dict:
        """
        Upload image to Cloudinary
        
        Args:
            file_data: Image file data
            public_id: Unique identifier for the image
            folder: Folder to store the image in
            
        Returns:
            dict: Upload response with URL and other details
        """
        if not self.is_configured:
            raise Exception("Cloudinary is not configured. Please set the required environment variables.")
        
        try:
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file_data,
                public_id=f"{folder}/{public_id}",
                overwrite=True,
                resource_type="image",
                transformation=[
                    {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                    {"radius": "max"}
                ]
            )
            
            return {
                "url": result.get("secure_url"),
                "public_id": result.get("public_id"),
                "width": result.get("width"),
                "height": result.get("height")
            }
            
        except Exception as e:
            raise Exception(f"Failed to upload image: {str(e)}")
    
    async def delete_image(self, public_id: str) -> bool:
        """
        Delete image from Cloudinary
        
        Args:
            public_id: Public ID of the image to delete
            
        Returns:
            bool: True if deleted successfully
        """
        if not self.is_configured:
            print("Cloudinary is not configured, cannot delete image")
            return False
            
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
        except Exception as e:
            print(f"Failed to delete image: {str(e)}")
            return False

# Global instance
cloudinary_config = CloudinaryConfig() 