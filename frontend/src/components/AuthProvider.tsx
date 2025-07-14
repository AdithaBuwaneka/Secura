'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setFirebaseUser, setIdToken } from '@/store/auth/authSlice';
import { AppDispatch } from '@/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch(setFirebaseUser(user));
      
      if (user) {
        // Get fresh ID token
        const idToken = await user.getIdToken();
        dispatch(setIdToken(idToken));
      } else {
        dispatch(setIdToken(null));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}