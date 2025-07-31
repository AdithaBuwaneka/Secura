'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Shield, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Save, 
  Camera,
  Eye,
  EyeOff
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { updateUserProfile, uploadProfilePicture } from '@/store/auth/authSlice';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const { userProfile, idToken, loading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        full_name: userProfile.full_name || '',
        email: userProfile.email || '',
        phone_number: userProfile.phone_number || ''
      }));
    }
  }, [userProfile]);

  const validatePhoneNumber = (phone: string): string => {
    if (!phone) return ''; // Allow empty phone number
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid phone number (7-15 digits)
    if (cleaned.length < 7 || cleaned.length > 15) {
      return 'Phone number must be between 7 and 15 digits';
    }
    
    // Check if it contains only digits
    if (!/^\d+$/.test(cleaned)) {
      return 'Phone number can only contain digits';
    }
    
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Validate phone number in real-time
    if (name === 'phone_number') {
      const phoneError = validatePhoneNumber(value);
      setErrors(prev => ({
        ...prev,
        phone_number: phoneError
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form fields
      const newErrors: {[key: string]: string} = {};
      
      // Validate full name
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Full name is required';
      }
      
      // Validate phone number
      const phoneError = validatePhoneNumber(formData.phone_number);
      if (phoneError) {
        newErrors.phone_number = phoneError;
      }
      
      // Validate passwords if changing
      if (formData.new_password || formData.current_password) {
        if (!formData.current_password) {
          newErrors.current_password = 'Current password is required to change password';
        }
        if (formData.new_password !== formData.confirm_password) {
          newErrors.confirm_password = 'New passwords do not match';
        }
        if (formData.new_password && formData.new_password.length < 6) {
          newErrors.new_password = 'New password must be at least 6 characters';
        }
      }
      
      // If there are validation errors, don't submit
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }

      // Update profile
      const updateData: any = {
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim()
      };

      if (formData.new_password) {
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }

      await dispatch(updateUserProfile(updateData)).unwrap();
      toast.success('Profile updated successfully');
      
      // Clear password fields and errors
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      setErrors({});
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      await dispatch(uploadProfilePicture(file)).unwrap();
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1D23] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF] mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1D23]">
      {/* Header */}
      <header className="bg-[#2A2D35] border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Back Button */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Shield className="h-8 w-8 text-[#00D4FF]" />
              <div>
                <h1 className="text-xl font-bold text-white">Edit Profile</h1>
                <p className="text-xs text-gray-400">Update your account information</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#2A2D35] rounded-lg border border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="relative">
                {userProfile?.profile_picture_url ? (
                  <img
                    src={userProfile.profile_picture_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-gray-600"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#0099CC] flex items-center justify-center text-white font-semibold text-xl border-4 border-gray-600">
                    {userProfile?.full_name ? (
                      userProfile.full_name.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)
                    ) : (
                      'EM'
                    )}
                  </div>
                )}
                <label
                  htmlFor="profile-picture-upload"
                  className="absolute -bottom-1 -right-1 p-2 bg-[#00D4FF] rounded-full text-[#1A1D23] hover:bg-[#00C4EF] transition-colors cursor-pointer"
                  title="Upload new photo"
                >
                  {isUploadingImage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1A1D23]"></div>
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </label>
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Profile Picture</h3>
                <p className="text-sm text-gray-400">
                  {isUploadingImage ? 'Uploading...' : 'Click the camera icon to upload a new photo'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, GIF (max 5MB)</p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <User className="h-5 w-5 mr-2 text-[#00D4FF]" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-[#1A1D23] border rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-[#00D4FF] transition-colors ${
                      errors.full_name 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-600 focus:border-[#00D4FF]'
                    }`}
                    placeholder="Enter your full name"
                    required
                  />
                  {errors.full_name && (
                    <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                      placeholder="email@example.com"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 bg-[#1A1D23] border rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-[#00D4FF] transition-colors ${
                        errors.phone_number 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-600 focus:border-[#00D4FF]'
                      }`}
                      placeholder="Enter your phone number (e.g., 1234567890)"
                    />
                  </div>
                  {errors.phone_number && (
                    <p className="text-red-400 text-xs mt-1">{errors.phone_number}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Optional - Enter digits only (7-15 digits)</p>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="space-y-4 pt-6 border-t border-gray-600">
              <h3 className="text-lg font-semibold text-white">Change Password</h3>
              <p className="text-sm text-gray-400">Leave blank if you don't want to change your password</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="current_password"
                      value={formData.current_password}
                      onChange={handleInputChange}
                      className={`w-full pr-10 py-3 bg-[#1A1D23] border rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-[#00D4FF] transition-colors ${
                        errors.current_password 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-600 focus:border-[#00D4FF]'
                      }`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.current_password && (
                    <p className="text-red-400 text-xs mt-1">{errors.current_password}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleInputChange}
                      className={`w-full pr-10 py-3 bg-[#1A1D23] border rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-[#00D4FF] transition-colors ${
                        errors.new_password 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-600 focus:border-[#00D4FF]'
                      }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.new_password && (
                    <p className="text-red-400 text-xs mt-1">{errors.new_password}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      className={`w-full pr-10 py-3 bg-[#1A1D23] border rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-[#00D4FF] transition-colors ${
                        errors.confirm_password 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-600 focus:border-[#00D4FF]'
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-red-400 text-xs mt-1">{errors.confirm_password}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#00D4FF] text-[#1A1D23] rounded-lg hover:bg-[#00C4EF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 