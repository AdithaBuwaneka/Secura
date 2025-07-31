# Cloudinary Setup Guide

## Overview
Cloudinary is used for profile picture uploads in the Secura application. It provides secure, optimized image storage and delivery.

## Current Status
✅ **Backend is running successfully**  
⚠️ **Cloudinary is not configured** - Profile picture uploads are disabled

## Setup Instructions

### 1. Create a Cloudinary Account
1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Click "Sign Up For Free"
3. Create your account (free tier includes 25GB storage)

### 2. Get Your Credentials
1. After signing up, go to your **Dashboard**
2. Look for the **Account Details** section
3. Copy these three values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Set Environment Variables
Create a `.env` file in your `backend` directory (if it doesn't exist) and add:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 4. Restart the Backend
After setting the environment variables, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
python run.py
```

### 5. Verify Setup
You should see this message when the backend starts:
```
✅ Cloudinary configured successfully
```

## Features Available After Setup

### Profile Picture Upload
- **File Types**: JPG, PNG, GIF
- **Max Size**: 5MB
- **Auto-optimization**: Images are automatically resized to 400x400 and made circular
- **Secure URLs**: All images are served over HTTPS

### API Endpoints
- `POST /api/auth/upload-profile-picture` - Upload profile picture
- Automatic integration with user profile updates

### Frontend Integration
- Camera icon in Edit Profile page
- Real-time upload progress
- Error handling and user feedback
- Profile picture display in dashboards

## Troubleshooting

### Backend Won't Start
- Check that all three environment variables are set
- Ensure no extra spaces in the `.env` file
- Verify the credentials are correct

### Upload Fails
- Check file size (must be < 5MB)
- Ensure file is an image (JPG, PNG, GIF)
- Verify Cloudinary account has available storage

### Frontend Shows Upload Error
- Check browser console for error details
- Verify backend is running on correct port
- Ensure user is authenticated

## Security Notes
- API credentials are stored in environment variables (not in code)
- Images are stored securely on Cloudinary's servers
- URLs are HTTPS by default
- No sensitive data is stored in image metadata

## Free Tier Limits
- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **Uploads**: 25,000/month

For most applications, the free tier is sufficient. Upgrade if you need more capacity.

---

**Need Help?** Check the Cloudinary documentation at [https://cloudinary.com/documentation](https://cloudinary.com/documentation) 