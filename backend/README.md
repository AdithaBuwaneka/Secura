# Secura Backend

This is the FastAPI backend for the Secura cybersecurity incident reporting platform.

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Configuration
Make sure the `.env` file is configured with your Firebase and ImageKit credentials. The `.env` file should contain:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# ImageKit Configuration
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# JWT Configuration
SECRET_KEY=your_secret_key_for_jwt
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# SendGrid (Email service)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_from_email

# Environment
ENVIRONMENT=development
```

### 3. Running the Backend

#### Option 1: Using the start script
```bash
# Windows
start.bat

# Or directly with Python
python run.py
```

#### Option 2: From the app directory
```bash
cd app
python main.py
```

#### Option 3: Using uvicorn directly
```bash
cd app
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## API Endpoints

- `GET /` - Root endpoint, returns API status
- `GET /health` - Health check endpoint
- `GET /test/database` - Test database connection
- `POST /test/initialize` - Initialize database collections
- `GET /test/imagekit` - Test ImageKit service connection

## Testing

The API runs on `http://127.0.0.1:8000` by default.

You can test the endpoints using:
- Browser: Navigate to `http://127.0.0.1:8000/docs` for interactive API documentation
- PowerShell: `Invoke-WebRequest -Uri "http://127.0.0.1:8000/health"`
- curl: `curl http://127.0.0.1:8000/health`

## Architecture

- **Framework**: FastAPI
- **Database**: Firebase Firestore
- **File Storage**: ImageKit
- **Authentication**: Firebase Auth + JWT
- **Email Service**: SendGrid

## Issues Fixed

1. ✅ Missing `imagekitio` package dependency
2. ✅ Import path issues (changed from `app.module` to relative imports)
3. ✅ CORS configuration for frontend communication
4. ✅ Firebase connection and configuration
5. ✅ Proper project structure and startup scripts
