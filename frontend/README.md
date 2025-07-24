# Secura Frontend

A modern Next.js frontend for the Secura cybersecurity incident reporting platform, built with React, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open browser**
   ```
   http://localhost:3000
   ```

## 🔐 Test Credentials

### Admin Account
- **Email:** `admin@secura.com`
- **Password:** `SecuraAdmin123!`

### Security Team Account
- **Email:** `security.lead@secura.com`
- **Password:** `SecuraSecLead123!`

### Employee Account
- Register new account at `/auth/register` (automatically assigned employee role)

## 🎯 Features

- **🔐 Authentication**: Firebase Auth with role-based access control
- **📊 Role-Based Dashboards**: Employee, Security Team, and Admin interfaces
- **🚨 Incident Reporting**: Complete incident management with file uploads
- **💬 Real-time Messaging**: WebSocket-based secure communication
- **📈 Analytics**: Chart.js visualizations with role-based data access
- **👥 Security Applications**: Employee-to-security team application system  
- **🛡️ Protected Routes**: Role-based access control throughout the app
- **📱 Responsive Design**: Mobile-first design with Tailwind CSS

## 🏗️ Architecture

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **File Storage**: ImageKit
- **Charts**: Chart.js with React Chart.js 2
- **Icons**: Lucide React
- **Build Tool**: Turbopack

## 📁 Project Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── applications/       # Security application pages
│   ├── auth/               # Authentication pages
│   ├── dashboard/         # Protected dashboard
│   └── page.tsx          # Landing page
├── components/            # Reusable React components
│   ├── analytics/         # Data visualization
│   ├── applications/      # Security applications
│   ├── dashboards/        # Role-based dashboards
│   ├── forms/             # Form components
│   └── messaging/         # Real-time messaging
├── lib/                  # Configuration
├── store/                # Redux Toolkit store
└── types/                # TypeScript definitions
```

## 🌐 Pages & Routes

### Public Pages
- **Home (/)**: Landing page with features overview
- **Login (/auth/login)**: User authentication
- **Register (/auth/register)**: New user registration

### Protected Pages (Role-Based)
- **Dashboard (/dashboard)**: Role-specific dashboard
- **Security Applications (/applications/*)**: Application system

## 👤 Role System

### 1. Employee (Default)
- Submit security incidents
- Apply for security team membership
- View personal incident history

### 2. Security Team
- Manage all security incidents
- Access analytics and AI tools
- Real-time messaging and collaboration

### 3. Admin
- Full system administration
- User management and role assignment
- Security application review and approval
- Executive analytics and compliance

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔧 Environment Setup

Create `.env.local` file:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ImageKit Configuration
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key

# Backend API
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## 🛠️ Dependencies

### Core
- Next.js 15.3.5
- React 19
- TypeScript 5
- Firebase 11.10.0
- Redux Toolkit 2.8.2
- Tailwind CSS 3.4.17

### Development
- ESLint 9
- Turbopack (built-in)

## 🌐 Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Common Issues

1. **Module not found**
   ```bash
   npm install
   ```

2. **Environment variables not loading**
   - Check `.env.local` exists
   - Ensure variables start with `NEXT_PUBLIC_`

3. **Backend connection fails**
   - Ensure backend runs on `http://127.0.0.1:8000`
   - Check `NEXT_PUBLIC_API_URL` in `.env.local`

4. **Authentication issues**
   - Verify Firebase configuration
   - Check browser console for errors

## ✅ Status

- **Development**: ✅ Fully operational
- **Authentication**: ✅ Firebase Auth working
- **State Management**: ✅ Redux configured
- **Backend Integration**: ✅ API communication functional
- **Role-Based Access**: ✅ All dashboards working
- **Code Quality**: ✅ Zero ESLint errors
- **TypeScript**: ✅ Strict mode enabled

## 🚀 Ready for Development!

The frontend is fully configured and integrated with the backend. All authentication flows, role-based dashboards, and API integrations are working correctly.