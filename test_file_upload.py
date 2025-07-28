#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test file upload functionality for incident attachments
"""

import requests
import json
import os
import sys
from io import BytesIO

# Configuration
API_URL = "http://127.0.0.1:8000"
TEST_TOKEN = "test_token_12345"  # You'll need to get a real token

def create_test_file():
    """Create a test file for upload"""
    content = b"This is a test file for incident attachment upload testing.\nCreated for debugging ImageKit integration."
    return BytesIO(content), "test_incident_attachment.txt", "text/plain"

def test_file_upload():
    """Test the complete file upload flow"""
    print("🧪 Testing file upload functionality...")
    
    # Step 1: Create a test incident first
    print("\n1. Creating test incident...")
    incident_data = {
        "title": "Test Incident for File Upload",
        "description": "This is a test incident created to test file upload functionality",
        "incident_type": "malware",
        "severity": "medium",
        "location": {
            "address": "Test Building, Floor 1"
        },
        "attachments": [],
        "additional_context": {
            "timestamp": "2025-01-28T10:00:00Z",
            "reporter_client": "test_script"
        }
    }
    
    headers = {
        "Authorization": f"Bearer {TEST_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{API_URL}/api/incidents/", 
                               json=incident_data, 
                               headers=headers)
        
        if response.status_code == 200:
            incident = response.json()
            incident_id = incident['id']
            print(f"Incident created successfully: {incident_id}")
        else:
            print(f"Failed to create incident: {response.status_code}")
            print(f"Response: {response.text}")
            return
        
    except requests.exceptions.ConnectionError:
        print("Could not connect to API server. Make sure the backend is running on http://127.0.0.1:8000")
        return
    except Exception as e:
        print(f"Error creating incident: {str(e)}")
        return
    
    # Step 2: Upload file attachment
    print(f"\n2. Uploading file to incident {incident_id}...")
    
    # Create test file
    file_content, filename, content_type = create_test_file()
    
    files = {
        'file': (filename, file_content, content_type)
    }
    
    upload_headers = {
        "Authorization": f"Bearer {TEST_TOKEN}"
        # Don't set Content-Type for multipart/form-data, let requests handle it
    }
    
    try:
        response = requests.post(f"{API_URL}/api/incidents/{incident_id}/attachments",
                               files=files,
                               headers=upload_headers)
        
        print(f"Upload response status: {response.status_code}")
        print(f"Upload response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("File uploaded successfully!")
            print(f"File details: {json.dumps(result, indent=2)}")
        else:
            print(f"File upload failed: {response.status_code}")
            
    except Exception as e:
        print(f"Error uploading file: {str(e)}")

def test_imagekit_direct():
    """Test ImageKit service directly"""
    print("\nTesting ImageKit service directly...")
    
    # This would require importing the ImageKit service
    # For now, we'll just check if the service can be imported
    try:
        import sys
        sys.path.append('D:/Secura/Secura/backend')
        
        from app.services.imagekit_service import ImageKitService
        imagekit = ImageKitService()
        print("ImageKit service imported successfully")
        
        # Test token generation
        token_data = imagekit.get_upload_token()
        print(f"Upload token generated: {token_data}")
        
    except ImportError as e:
        print(f"Could not import ImageKit service: {e}")
    except Exception as e:
        print(f"Error testing ImageKit service: {e}")

if __name__ == "__main__":
    print("Starting file upload integration test...")
    print("="*50)
    
    # Note: You need to get a real Firebase ID token for this to work
    print("Note: You need to replace TEST_TOKEN with a real Firebase ID token")
    print("   You can get one from the browser developer tools when logged in")
    print()
    
    # Test ImageKit service first
    test_imagekit_direct()
    
    # Test full upload flow
    # test_file_upload()  # Uncomment when you have a real token
    
    print("\n" + "="*50)
    print("Test completed!")