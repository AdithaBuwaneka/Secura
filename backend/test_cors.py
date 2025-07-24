import requests
import json

def test_cors_functionality():
    """
    Test CORS configuration to ensure frontend can connect to backend
    """
    print("🧪 Testing CORS Configuration...")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:8000"
    
    # Test different origins that might be used by frontend
    test_origins = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002"
    ]
    
    # Test endpoints
    endpoints_to_test = [
        "/",
        "/health",
        "/api/auth/profile",
        "/api/security-applications/can-apply"
    ]
    
    success_count = 0
    total_tests = 0
    
    for origin in test_origins:
        print(f"\n🌐 Testing Origin: {origin}")
        print("-" * 30)
        
        for endpoint in endpoints_to_test:
            total_tests += 1
            url = f"{base_url}{endpoint}"
            
            try:
                # Test OPTIONS (preflight) request
                options_headers = {
                    'Origin': origin,
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type,Authorization'
                }
                
                options_response = requests.options(url, headers=options_headers, timeout=5)
                
                # Test actual GET request
                get_headers = {'Origin': origin}
                get_response = requests.get(url, headers=get_headers, timeout=5)
                
                # Check CORS headers
                cors_origin = get_response.headers.get('Access-Control-Allow-Origin')
                
                if cors_origin == '*' or cors_origin == origin:
                    print(f"✅ {endpoint} - CORS OK (Status: {get_response.status_code})")
                    success_count += 1
                else:
                    print(f"❌ {endpoint} - CORS Failed (Origin: {cors_origin})")
                    
            except requests.exceptions.ConnectionError:
                print(f"🔌 {endpoint} - Server not running")
            except requests.exceptions.Timeout:
                print(f"⏰ {endpoint} - Request timeout")
            except Exception as e:
                print(f"❌ {endpoint} - Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {success_count}/{total_tests} tests passed")
    
    if success_count == total_tests:
        print("🎉 All CORS tests passed! Frontend can connect to backend.")
    else:
        print("⚠️  Some CORS tests failed. Check server configuration.")
    
    return success_count == total_tests

def test_specific_api_endpoints():
    """
    Test specific API endpoints that were having CORS issues
    """
    print("\n🎯 Testing Specific API Endpoints...")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:8000"
    origin = "http://localhost:3002"  # Your frontend origin
    
    # Specific endpoints that were failing
    test_cases = [
        {
            "endpoint": "/api/auth/register",
            "method": "POST",
            "description": "User registration"
        },
        {
            "endpoint": "/api/auth/profile", 
            "method": "GET",
            "description": "Get user profile"
        },
        {
            "endpoint": "/api/security-applications/can-apply",
            "method": "GET", 
            "description": "Check application eligibility"
        }
    ]
    
    for test_case in test_cases:
        endpoint = test_case["endpoint"]
        method = test_case["method"]
        description = test_case["description"]
        
        print(f"\n🔍 Testing: {description}")
        print(f"   Endpoint: {method} {endpoint}")
        
        try:
            # Test OPTIONS preflight for the specific method
            options_headers = {
                'Origin': origin,
                'Access-Control-Request-Method': method,
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
            
            options_response = requests.options(
                f"{base_url}{endpoint}", 
                headers=options_headers, 
                timeout=5
            )
            
            cors_origin = options_response.headers.get('Access-Control-Allow-Origin')
            cors_methods = options_response.headers.get('Access-Control-Allow-Methods')
            
            print(f"   OPTIONS Status: {options_response.status_code}")
            print(f"   CORS Origin: {cors_origin}")
            print(f"   Allowed Methods: {cors_methods}")
            
            if cors_origin == '*' and method in str(cors_methods):
                print("   ✅ CORS preflight passed")
            else:
                print("   ❌ CORS preflight failed")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Secura Backend CORS Test Suite")
    print("=" * 50)
    
    # Run basic CORS tests
    basic_success = test_cors_functionality()
    
    # Run specific API endpoint tests
    test_specific_api_endpoints()
    
    print("\n" + "=" * 50)
    if basic_success:
        print("✨ CORS is properly configured for your frontend!")
        print("Your React app on http://localhost:3002 should work perfectly.")
    else:
        print("🔧 CORS configuration needs attention.")
    
    print("\n💡 Tips:")
    print("- Make sure your backend server is running on http://127.0.0.1:8000")
    print("- Verify your frontend is making requests to the correct URL")
    print("- Check browser console for any remaining CORS errors")
