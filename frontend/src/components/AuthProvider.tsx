'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setFirebaseUser, setIdToken, setUserProfile, clearAuth } from '@/store/auth/authSlice';
import { AppDispatch } from '@/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch(setFirebaseUser(user));
      
      if (user) {
        try {
          // Get fresh ID token
          const idToken = await user.getIdToken();
          dispatch(setIdToken(idToken));
          
          // Fetch user profile from backend
          console.log('AuthProvider fetching profile with token:', idToken ? 'present' : 'missing');
          const response = await fetch(`${API_URL}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          
          console.log('Profile fetch response status:', response.status);
          if (response.ok) {
            const userProfile = await response.json();
            console.log('Profile fetched successfully:', userProfile);
            dispatch(setUserProfile(userProfile));
          } else {
            const errorData = await response.json();
            console.log('Profile fetch failed:', errorData);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        dispatch(setIdToken(null));
        dispatch(clearAuth());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}