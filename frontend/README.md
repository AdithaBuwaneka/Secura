# Secura Frontend

This is the Next.js frontend for the Secura cybersecurity incident reporting platform, built with React, TypeScript, and Tailwind CSS.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the frontend root directory with the following environment variables:

```env
# Firebase Configuration (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# ImageKit Configuration (Frontend)
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key

# Backend API URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
```

### 3. Running the Frontend

#### Option 1: Development mode with Turbopack (Recommended)
```bash
npm run dev
```

#### Option 2: Standard development mode
```bash
npm run dev -- --no-turbopack
```

#### Option 3: Production build and start
```bash
npm run build
npm run start
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Features

- **Incident Reporting**: Submit and track cybersecurity incidents
- **Dashboard**: View analytics and incident statistics
- **Authentication**: Firebase-based user authentication
- **File Uploads**: ImageKit integration for secure file handling
- **Responsive Design**: Mobile-first responsive UI with Tailwind CSS
- **Real-time Updates**: Live data synchronization with Firebase
- **State Management**: Redux Toolkit for application state

## Architecture

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **File Storage**: ImageKit
- **Charts**: Chart.js with React Chart.js 2
- **Icons**: Lucide React
- **Build Tool**: Turbopack (development)

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout component
│   └── page.tsx        # Home page
├── lib/                # Configuration and utilities
│   ├── firebase.ts     # Firebase configuration
│   └── imagekit.ts     # ImageKit configuration
└── types/              # TypeScript type definitions
    └── index.ts        # Shared type definitions
```

## Dependencies

### Core Dependencies
- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **Firebase**: Authentication and database
- **ImageKit React**: File upload and management
- **Redux Toolkit**: State management
- **Chart.js**: Data visualization
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Dependencies
- **ESLint**: Code linting
- **Autoprefixer**: CSS vendor prefixes
- **PostCSS**: CSS processing

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Notes

1. The frontend communicates with the backend API running on `http://127.0.0.1:8000`
2. Firebase is configured for both authentication and Firestore database access
3. ImageKit handles all file uploads and image processing
4. Turbopack is enabled for faster development builds
5. The app uses the Next.js App Router for routing and layouts

## Issues Fixed

1. ✅ Firebase configuration and authentication setup
2. ✅ ImageKit integration for file uploads
3. ✅ Redux Toolkit configuration for state management
4. ✅ Tailwind CSS setup and configuration
5. ✅ TypeScript configuration and type definitions
6. ✅ ESLint configuration for code quality
