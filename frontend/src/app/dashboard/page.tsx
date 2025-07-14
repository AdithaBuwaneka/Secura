'use client';

import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '@/store/auth/authSlice';
import { RootState, AppDispatch } from '@/store';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-xl font-bold text-gray-900">🛡️ Secura</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {userProfile?.full_name}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                  {userProfile?.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to Secura Dashboard
                </h1>
                <p className="text-gray-600 mb-4">
                  Cybersecurity Incident Reporting Platform
                </p>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-2">Your Profile</h2>
                  <p><strong>Name:</strong> {userProfile?.full_name}</p>
                  <p><strong>Email:</strong> {userProfile?.email}</p>
                  <p><strong>Role:</strong> {userProfile?.role}</p>
                  {userProfile?.department && (
                    <p><strong>Department:</strong> {userProfile.department}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}