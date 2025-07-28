#!/usr/bin/env python3

import io
import asyncio
from fastapi import UploadFile
from app.services.imagekit_service import imagekit_service

def create_test_file():
    """Create a test text file for upload"""
    content = b"Test file content for ImageKit upload testing\nCreated at: 2025-01-28\nThis is a test file."
    return io.BytesIO(content)

async def test_imagekit_upload():
    print('Testing ImageKit file upload...')
    
    try:
        # Create test file
        test_content = create_test_file()
        
        # Create mock UploadFile
        upload_file = UploadFile(
            filename="test_file.txt",
            file=test_content,
            size=len(test_content.getvalue()),
            headers={"content-type": "text/plain"}
        )
        
        print(f'Uploading test file: {upload_file.filename} ({upload_file.size} bytes)')
        
        # Test upload
        result = await imagekit_service.upload_file(
            file=upload_file,
            incident_id="test_incident_123",
            uploader_id="test_user_456",
            folder="test-uploads"
        )
        
        print('\n=== Upload Result ===')
        if result.get('success'):
            print('SUCCESS: Upload successful!')
            print(f'File ID: {result.get("file_id")}')
            print(f'URL: {result.get("url")}')
            print(f'Thumbnail URL: {result.get("thumbnail_url")}')
            print(f'File Hash: {result.get("file_hash")}')
            
            # Test secure URL generation
            if result.get("url"):
                file_path = result.get("url").split('/')[-1]
                secure_url_result = imagekit_service.generate_secure_url(file_path, 600)
                if secure_url_result.get('success'):
                    print(f'Secure URL: {secure_url_result.get("secure_url")}')
                
        else:
            print('FAILED: Upload failed!')
            print(f'Error: {result.get("error")}')
            
    except Exception as e:
        print(f'Error during upload test: {e}')
        import traceback
        traceback.print_exc()

def test_upload_token():
    print('\n=== Testing Upload Token Generation ===')
    token_result = imagekit_service.get_upload_token()
    
    if token_result.get('success'):
        print('SUCCESS: Token generation successful!')
        print(f'Public Key: {token_result.get("public_key")}')
        print(f'URL Endpoint: {token_result.get("url_endpoint")}')
        print(f'Token: {token_result.get("token")[:20]}...')
    else:
        print('FAILED: Token generation failed!')
        print(f'Error: {token_result.get("error")}')

async def main():
    print('ImageKit File Save Test\n')
    
    # Test 1: Upload token generation
    test_upload_token()
    
    # Test 2: File upload
    await test_imagekit_upload()
    
    print('\nImageKit test completed!')

if __name__ == '__main__':
    asyncio.run(main())