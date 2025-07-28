#!/usr/bin/env python3
"""
Debug file upload by checking backend logs
"""

import time
import sys

def monitor_logs():
    """Monitor for any file upload related logs"""
    print("Monitoring for file upload issues...")
    print("Please try uploading a file through the web interface now.")
    print("Check the backend console for debug messages.")
    print("")
    print("Expected debug messages should include:")
    print("- DEBUG: File upload attempt - filename: xxx")
    print("- DEBUG FileService: Starting upload for file xxx")
    print("- DEBUG ImageKitService: Starting upload for file xxx")
    print("- DEBUG ImageKitService: ImageKit upload successful - file_id: xxx")
    print("")
    print("If you don't see these messages, the issue might be:")
    print("1. Files not being sent from frontend")
    print("2. Authentication issues")
    print("3. API endpoint not being reached")
    print("")
    print("Press Ctrl+C to exit monitoring")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nMonitoring stopped.")

if __name__ == "__main__":
    monitor_logs()