# Secura Backend

A FastAPI backend for the Secura cybersecurity incident reporting platform with AI-powered threat analysis and real-time collaboration.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment**
   ```bash
   # Copy .env.example to .env and configure Firebase credentials
   cp .env.example .env
   ```

3. **Create admin user**
   ```bash
   python scripts/create_admin.py
   ```

4. **Start server**
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

5. **Verify running**
   ```
   http://127.0.0.1:8000/docs
   ```

## 🔐 Test Credentials

### Admin User
- **Email:** `admin@secura.com`
- **Password:** `SecuraAdmin123!`

### Security Team Users
Created via: `python scripts/create_security_team.py`
- `security.lead@secura.com` / `SecuraSecLead123!`
- `analyst1@secura.com` / `SecuraAnalyst123!`
- `analyst2@secura.com` / `SecuraAnalyst234!`
- `incident.response@secura.com` / `SecuraIncident123!`

## 🎯 Features

- **🔐 Authentication**: Firebase ID token auth with role-based access
- **📋 Incident Management**: Complete CRUD with file uploads and messaging
- **🤖 AI Engine**: NLP categorization, severity assessment, and threat intelligence
- **📊 Analytics**: Real-time dashboards and compliance reporting
- **💬 Real-time Messaging**: WebSocket communication for incident collaboration
- **📧 Notifications**: SendGrid email and Firebase push notifications
- **🛡️ Security Applications**: Employee-to-security team application system

## 🏗️ Architecture

- **Framework**: FastAPI with automatic OpenAPI docs
- **Database**: Firebase Firestore for real-time sync
- **Authentication**: Firebase ID tokens (no custom JWT)
- **File Storage**: ImageKit with virus scanning
- **Email**: SendGrid integration
- **AI/ML**: Scikit-learn, Transformers, NLP libraries

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI entry point
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── security_applications/ # Security team applications
│   │   ├── incidents/         # Incident management
│   │   ├── ai/                # AI engine endpoints
│   │   └── analytics/         # Analytics and reporting
│   ├── core/
│   │   └── firebase_config.py # Firebase configuration
│   ├── models/                # Pydantic data models
│   ├── services/              # Business logic
│   └── utils/                 # Utilities
├── scripts/                   # Setup scripts
├── requirements.txt           # Dependencies
└── .env                      # Environment variables
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user (auto employee role)
- `POST /verify-token` - Verify Firebase ID token
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /admin/manage-security-team` - Manage security team (Admin)
- `GET /admin/users` - List all users (Admin)

### Security Applications (`/api/security-applications`)
- `POST /apply` - Submit security team application
- `GET /my-applications` - Get user's applications
- `GET /admin/pending` - Get pending applications (Admin)
- `PUT /admin/review/{id}` - Review application (Admin)
- `GET /can-apply` - Check if user can apply

### Incidents (`/api/incidents`)
- `POST /` - Create incident
- `GET /` - Get incidents (role-filtered)
- `GET /{id}` - Get specific incident
- `PUT /{id}` - Update incident
- `POST /{id}/assign` - Assign to security team
- `POST /{id}/messages` - Send message
- `WebSocket /ws/{user_id}` - Real-time updates

### AI Engine (`/api/ai`)
- `POST /analyze-incident` - Comprehensive AI analysis
- `POST /categorize` - Category suggestions
- `POST /assess-severity` - Severity assessment
- `POST /mitigation-strategies` - AI mitigation strategies
- `GET /threat-intelligence` - Threat intelligence data
- `POST /anomaly-detection` - Anomaly detection

### Analytics (`/api/analytics`)
- `GET /dashboard` - Real-time dashboard data
- `GET /incidents/statistics` - Incident statistics
- `GET /incidents/trends` - Trend analysis
- `GET /export` - Export data
- `POST /reports/generate` - Generate compliance reports
- `POST /notifications/email` - Send email notifications

## 👤 Role System

### Employee (Default)
- Submit security incidents
- Upload evidence files
- Apply for security team membership
- Track personal incident status

### Security Team
- Manage all incidents
- Use AI analysis tools
- Access threat intelligence
- Real-time collaboration messaging

### Admin
- Review security team applications
- Manage users and roles
- Generate compliance reports
- Access executive dashboards

## 🔧 Environment Configuration

Create `.env` file:

```env
# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# ImageKit Configuration (Optional)
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# SendGrid Configuration (Optional)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@your-domain.com

# Environment
ENVIRONMENT=development
```

## 🛠️ Dependencies

### Core
- FastAPI 0.104.1
- Uvicorn 0.24.0
- Firebase Admin 6.2.0
- Pydantic 2.0+
- Python Multipart 0.0.6

### AI/ML
- Scikit-learn 1.3+
- Transformers 4.30+
- Pandas 2.0+
- NumPy 1.24+

### Services
- SendGrid 6.11.0
- ImageKitIO 4.1.0
- WebSockets 12.0

## 🧪 Testing & Verification

### Health Check
```bash
curl http://127.0.0.1:8000/health
# Expected: {"status":"healthy","service":"Secura Backend"}
```

### API Status
```bash
curl http://127.0.0.1:8000/
# Expected: {"message":"Secura API is running!","status":"healthy"}
```

### Interactive Docs
```
http://127.0.0.1:8000/docs
```

### Authentication Test
```bash
curl http://127.0.0.1:8000/api/auth/admin/users
# Expected: {"detail":"Not authenticated"}
```

## 🐛 Troubleshooting

### Common Issues

1. **ModuleNotFoundError**
   ```bash
   # Run from backend directory, not backend/app
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Firebase Connection**
   ```bash
   # Verify Firebase credentials in .env
   python -c "from app.core.firebase_config import FirebaseConfig; print('OK' if FirebaseConfig.get_firestore() else 'Failed')"
   ```

3. **Port Already in Use**
   ```bash
   # Use different port
   uvicorn app.main:app --reload --port 8001
   ```

4. **Dependencies Missing**
   ```bash
   pip install -r requirements.txt
   ```

## ✅ Status

- **Server**: ✅ Running on http://127.0.0.1:8000
- **Database**: ✅ Firebase Firestore connected
- **Authentication**: ✅ Firebase ID token auth working
- **API Endpoints**: ✅ 40+ endpoints operational
- **Services**: ✅ All business logic modules working
- **Documentation**: ✅ Interactive docs at /docs
- **Security**: ✅ Role-based access control active

## 🚀 Production Ready!

The Secura backend is fully operational with all core features implemented:
- Complete authentication system
- Incident management with real-time updates
- AI-powered threat analysis
- Analytics and compliance reporting
- Role-based security access control

Ready for frontend integration and production deployment!