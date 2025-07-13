from imagekitio import ImageKit
import os
from dotenv import load_dotenv

load_dotenv()

class ImageKitService:
    def __init__(self):
        self.imagekit = ImageKit(
            private_key=os.getenv('IMAGEKIT_PRIVATE_KEY'),
            public_key=os.getenv('IMAGEKIT_PUBLIC_KEY'),
            url_endpoint=os.getenv('IMAGEKIT_URL_ENDPOINT')
        )
    
    def get_upload_token(self):
        """Generate upload token for frontend"""
        try:
            authentication_parameters = self.imagekit.get_authentication_parameters()
            return {
                "signature": authentication_parameters['signature'],
                "expire": authentication_parameters['expire'],
                "token": authentication_parameters['token']
            }
        except Exception as e:
            return {"error": str(e)}
    
    def upload_file(self, file, file_name: str, folder: str = "incidents"):
        """Upload file to ImageKit"""
        try:
            upload_result = self.imagekit.upload_file(
                file=file,
                file_name=file_name,
                options={
                    "folder": f"/{folder}/",
                    "is_private_file": False,
                    "use_unique_file_name": True,
                }
            )
            return {
                "success": True,
                "file_id": upload_result.file_id,
                "url": upload_result.url,
                "name": upload_result.name
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

# Create instance
imagekit_service = ImageKitService()