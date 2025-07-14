'use client';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RootState } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('employee' | 'security_team' | 'executive' | 'admin')[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [],
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, userProfile, loading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }
      
      if (allowedRoles.length > 0 && userProfile && !allowedRoles.includes(userProfile.role)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, userProfile, loading, allowedRoles, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles.length > 0 && userProfile && !allowedRoles.includes(userProfile.role))) {
    return null;
  }

  return <>{children}</>;
}