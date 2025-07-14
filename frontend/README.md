# Secura Frontend

This is the Next.js frontend for the Secura cybersecurity incident reporting platform, built with React, TypeScript, and Tailwind CSS.

## Setup Instructions

### 1. Prerequisites
- **Node.js 18+** (Recommended: Node.js 20 or higher)
- **npm** or **yarn** package manager

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
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

**Note**: The `.env.local` file is already configured for development. Only update the Firebase and ImageKit credentials if needed for your specific project setup.

### 4. Running the Frontend

#### Option 1: Development mode with Turbopack (Recommended)
```bash
npm run dev
```
This will start the development server with Turbopack for faster builds and hot reload.

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

**Backend Dependency**: Ensure the backend server is running on `http://127.0.0.1:8000` for full functionality.

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
- **Next.js 15.3.5**: React framework with App Router and Turbopack
- **React 19**: Latest UI library with concurrent features
- **TypeScript 5**: Type-safe JavaScript development
- **Firebase 11.10.0**: Authentication and Firestore database
- **ImageKit React 4.3.0**: File upload and image management
- **Redux Toolkit 2.8.2**: Modern state management
- **Chart.js 4.5.0**: Data visualization and analytics
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Lucide React 0.525.0**: Modern icon library

### Development Dependencies
- **ESLint 9**: Code linting and quality assurance
- **Autoprefixer 10.4.21**: CSS vendor prefixes
- **PostCSS 8.5.6**: CSS processing and transformation

## Browser Support

- **Chrome 90+** (Recommended)
- **Firefox 90+**
- **Safari 14+**
- **Edge 90+**

## Development Notes

1. **Backend Communication**: Frontend is configured to communicate with backend API at `http://127.0.0.1:8000`
2. **Firebase Integration**: Both authentication and Firestore database are properly configured
3. **ImageKit Storage**: All file uploads and image processing handled by ImageKit service
4. **Turbopack**: Enabled by default for faster development builds (can be disabled with `--no-turbopack`)
5. **Hot Reload**: Automatic page refresh on file changes with Fast Refresh support
6. **TypeScript**: Strict mode enabled for better type safety
7. **State Management**: Redux Toolkit configured for scalable state management
8. **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints
9. **Environment Variables**: All public environment variables prefixed with `NEXT_PUBLIC_`
10. **CORS**: Backend configured to accept requests from `http://localhost:3000`

## Issues Fixed

1. ✅ Firebase configuration and authentication setup
2. ✅ ImageKit integration for file uploads
3. ✅ Redux Toolkit configuration for state management
4. ✅ Tailwind CSS setup and configuration
5. ✅ TypeScript configuration and type definitions
6. ✅ ESLint configuration for code quality
7. ✅ Turbopack integration for faster development builds
8. ✅ Environment variables loading and configuration
9. ✅ CORS configuration for backend communication

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - **Solution**: Run `npm install` to ensure all dependencies are installed
   - **Check**: Verify `node_modules` directory exists

2. **Environment variables not loading**
   - **Solution**: Ensure `.env.local` file exists in the frontend root directory
   - **Check**: All environment variables must start with `NEXT_PUBLIC_` for client-side access

3. **Build fails with permission errors**
   - **Cause**: Development server is running while building
   - **Solution**: Stop the dev server (`Ctrl+C`) before running `npm run build`

4. **Backend API connection fails**
   - **Solution**: Ensure backend server is running on `http://127.0.0.1:8000`
   - **Check**: Verify `NEXT_PUBLIC_API_URL` in `.env.local` matches backend URL

5. **Turbopack build issues**
   - **Solution**: Use standard mode: `npm run dev -- --no-turbopack`
   - **Alternative**: Update to latest Next.js version

### Verification Steps

After starting the development server:

1. **Check Terminal Output**: Look for "Ready in [time]" message
2. **Browser Access**: Navigate to `http://localhost:3000`
3. **Hot Reload**: Make a change to see if page updates automatically
4. **Network Tab**: Check if backend API calls are successful (F12 → Network)
5. **Console Errors**: Check browser console for any JavaScript errors

### Performance Tips

- Use Turbopack for faster development builds
- Enable Next.js Fast Refresh for instant feedback
- Use browser dev tools to monitor performance
- Check bundle analyzer for optimization opportunities

## Current Status: ✅ WORKING

- **Development Server**: Running on `http://localhost:3000`
- **Build System**: Next.js 15 with Turbopack enabled
- **Hot Reload**: ✅ Functional
- **TypeScript**: ✅ Compilation working
- **Linting**: ✅ No errors
- **Environment**: ✅ Variables loaded
- **Backend Connection**: ✅ CORS configured
