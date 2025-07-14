# Secura Backend

This is the FastAPI backend for the Secura cybersecurity incident reporting platform.

## Features

- **Authentication**: Firebase Auth (ID Token verification) with role-based access control
- **User Management**: Complete user registration, pro5. **Backend Not Responding to Requests**
   - **Solution**: Ensure the server is running and check the port (should be 8000)
   - **Check**: Task output should show "Application startup complete"

6. **Role-Based Access Denied**
   - **Solution**: Ensure user has correct role assigned in Firestore user profile
   - **Admin Only**: `/users/all` endpoint requires Admin or Security Team rolemanagement, and role assignment
- **Database**: Firebase Firestore with user profiles and incident data
- **File Storage**: ImageKit integration for incident attachments
- **Email Service**: SendGrid (ready for notifications)
- **CORS**: Configured for frontend communication
- **Auto Documentation**: FastAPI automatic API docs
- **Role-Based Access**: Support for Employee, Security Team, Executive, and Admin roles

## Setup Instructions

### 1. Prerequisites
- **Python 3.8+** (Recommended: Python 3.10 or higher)
- **pip** (Python package manager)

### 2. Install Dependencies
```bash
# Install all required dependencies
pip install -r requirements.txt

# Or install individually if needed:
pip install fastapi==0.104.1
pip install uvicorn[standard]==0.24.0
pip install python-multipart==0.0.6
pip install firebase-admin==6.2.0
pip install python-dotenv==1.0.0
pip install pydantic[email]>=2.0.0
pip install sendgrid==6.11.0
pip install imagekitio==4.1.0
```

**Important**: The `pydantic[email]` package is required for email validation in user profiles.

### 3. Environment Configuration
Create a `.env` file in the backend directory with your Firebase and ImageKit credentials:

```env
# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# ImageKit Configuration (Optional)
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# SendGrid Configuration (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_from_email

# Environment
ENVIRONMENT=development
```

**Note**: Only Firebase configuration is required for basic functionality. ImageKit and SendGrid are optional services.

### 4. Running the Backend

### 4. Running the Backend

#### Option 1: Using VS Code Task (Recommended)
Use the "Start Backend Server" task in VS Code. The task will automatically:
- Set the correct working directory
- Run the server with auto-reload enabled
- Handle all import paths correctly

#### Option 2: Using the app/main.py directly
```bash
# Navigate to the app directory first
cd backend/app
python main.py
```

#### Option 3: Using the start script
```bash
# Windows
start.bat

# Or using the Python runner from backend directory
python run.py
```

#### Option 4: Using uvicorn directly
```bash
# From the backend/app directory
cd backend/app
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The server will start on `http://127.0.0.1:8000`

**Note**: If you encounter import errors, ensure you're running from the correct directory (`backend/app`) as the import paths are configured for this structure.

## API Endpoints

### Public Endpoints
- `GET /` - Root endpoint, returns API status
- `GET /health` - Health check endpoint
- `GET /test/` - Basic test endpoint
- `GET /test/firebase` - Test Firebase Firestore connection

### User Management Endpoints (Require Firebase Auth)
- `POST /users/register` - Register new user profile in Firestore
- `GET /users/profile` - Get current user's profile
- `PUT /users/profile` - Update current user's profile
- `GET /users/all` - Get all users (Admin/Security Team only)
- `POST /users/verify-token` - Verify Firebase ID token validity

### Protected Test Endpoints (Require Firebase Auth)
- `GET /test/auth` - Test Firebase authentication (requires Bearer token)

## Authentication

The API uses Firebase Authentication with ID tokens:

1. **Frontend Login**: Users authenticate via Firebase Auth in the frontend
2. **Token Sending**: Frontend sends Firebase ID token in Authorization header: `Bearer <id_token>`
3. **Token Verification**: Backend verifies the ID token with Firebase Admin SDK
4. **User Data**: Backend retrieves user profile from Firestore using the verified UID

### Testing Authentication

1. **Get Firebase ID Token** from your frontend or Firebase console
2. **Send requests** with the token:
   ```bash
   curl -H "Authorization: Bearer YOUR_ID_TOKEN" http://127.0.0.1:8000/test/auth
   ```

## Testing

### Quick Test
The API runs on `http://127.0.0.1:8000` by default.

Test the basic endpoints:
- **Browser**: Navigate to `http://127.0.0.1:8000/docs` for interactive API documentation
- **PowerShell**: `Invoke-WebRequest -Uri "http://127.0.0.1:8000/health"`
- **curl**: `curl http://127.0.0.1:8000/health`

### Firebase Connection Test
```bash
# Test Firebase Firestore connection
curl http://127.0.0.1:8000/test/firebase
```

### User Management Examples

#### Register New User
```bash
curl -X POST "http://127.0.0.1:8000/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "firebase_uid_here",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "employee",
    "department": "IT Security"
  }'
```

#### Get User Profile (Requires Auth)
```bash
curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
  http://127.0.0.1:8000/users/profile
```

#### Update User Profile (Requires Auth)
```bash
curl -X PUT "http://127.0.0.1:8000/users/profile" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Name",
    "department": "Cybersecurity"
  }'
```

## Dependencies

Current dependencies in `requirements.txt`:
- `fastapi==0.104.1` - Web framework
- `uvicorn[standard]==0.24.0` - ASGI server
- `python-multipart==0.0.6` - Form data handling
- `firebase-admin==6.2.0` - Firebase Admin SDK
- `python-dotenv==1.0.0` - Environment variable loading
- `pydantic[email]>=2.0.0` - Data validation with email support (includes email-validator)
- `sendgrid==6.11.0` - Email service (optional)
- `imagekitio==4.1.0` - Image storage service (optional)

**Email Validation**: The `pydantic[email]` package automatically installs `email-validator` and `dnspython` for proper email validation in user profiles.

## Architecture

- **Framework**: FastAPI (Python web framework)
- **Database**: Firebase Firestore (NoSQL document database)
- **Authentication**: Firebase Auth (ID token verification only)
- **File Storage**: ImageKit (for incident attachments)
- **Email Service**: SendGrid (for notifications)
- **Documentation**: Auto-generated with FastAPI/OpenAPI

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── api/
│   │   ├── __init__.py
│   │   ├── test.py          # Test endpoints
│   │   └── users.py         # User management endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   └── firebase_config.py   # Firebase configuration
│   ├── models/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication models
│   │   ├── common.py        # Common enums and models
│   │   ├── user.py          # User profile models
│   │   ├── incident.py      # Incident reporting models
│   │   ├── message.py       # Message models
│   │   └── file.py          # File upload models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── database.py      # Database operations
│   │   └── imagekit_service.py  # ImageKit integration
│   └── utils/
│       ├── __init__.py
│       └── auth.py          # Authentication utilities
├── requirements.txt         # Python dependencies
├── run.py                  # Alternative startup script
├── start.bat              # Windows startup script
└── README.md              # This file
```

## Recent Changes & Fixes

✅ **Fixed Authentication Dependency Bug**: Resolved `TypeError` in `require_roles` function by removing incorrect `async` declaration  
✅ **Fixed Pydantic Compatibility**: Updated `.dict()` to `.model_dump()` for Pydantic v2 compatibility  
✅ **Added User Management**: Complete user registration, profile management, and role-based access control  
✅ **Removed Custom JWT**: Simplified authentication to use only Firebase ID tokens  
✅ **Firebase-Only Auth**: Backend now verifies Firebase ID tokens directly  
✅ **Cleaner Dependencies**: Removed JWT-related packages from requirements  
✅ **Updated Documentation**: README reflects current Firebase-only setup  
✅ **Fixed Import Issues**: Resolved module import paths for proper execution  
✅ **Added Email Validation**: Included pydantic[email] for user profile validation  
✅ **Improved VS Code Task**: Task now runs from correct directory  
✅ **Backend Fully Operational**: All endpoints tested and working correctly

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError: No module named 'app'**
   - **Solution**: Make sure you're running from the `backend/app` directory, not the `backend` directory
   - **Command**: `cd backend/app && python main.py`

2. **ImportError: email-validator is not installed**
   - **Solution**: Install pydantic with email support: `pip install pydantic[email]`

3. **VS Code Task Fails**
   - **Solution**: The task is configured to run from `backend/app` directory automatically
   - **Check**: Ensure the task definition in `.vscode/tasks.json` is correct

4. **Firebase Connection Errors**
4. **Firebase Connection Errors**
   - **Solution**: Check your `.env` file has correct Firebase credentials
   - **Test**: Visit `http://127.0.0.1:8000/test/firebase` to verify connection

5. **VS Code Task Fails**
   - **Solution**: The task is configured to run from `backend/app` directory automatically
   - **Check**: Ensure the task definition in `.vscode/tasks.json` is correct

### Verification Steps

After starting the server, test these endpoints:
- `http://127.0.0.1:8000/` - Should return API status
- `http://127.0.0.1:8000/health` - Should return health status
- `http://127.0.0.1:8000/test/` - Should return test response
- `http://127.0.0.1:8000/test/firebase` - Should confirm Firebase connection
- `http://127.0.0.1:8000/docs` - Interactive API documentation
