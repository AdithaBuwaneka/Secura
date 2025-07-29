'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Plus, 
  FileText, 
  MessageCircle,
  LogOut,
  UserCheck
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { logoutUser } from '@/store/auth/authSlice';
import { checkCanApply } from '@/store/applications/applicationSlice';
import IncidentReportForm from '@/components/forms/IncidentReportForm';
import MessageThread from '@/components/messaging/MessageThread';
import { useMessaging } from '@/components/messaging/MessagingProvider';
import NotificationDropdown from '@/components/ui/NotificationDropdown';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { canApply } = useSelector((state: RootState) => state.applications);
  const dispatch = useDispatch<AppDispatch>();
  const { unreadCount, isConnected } = useMessaging();
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);

  useEffect(() => {
    dispatch(checkCanApply());
  }, [dispatch]);

  // Listen for messaging events from notifications
  useEffect(() => {
    const handleOpenMessaging = (event: CustomEvent) => {
      if (event.detail?.source === 'notification') {
        setShowMessaging(true);
      }
    };

    window.addEventListener('openMessaging', handleOpenMessaging as EventListener);
    
    return () => {
      window.removeEventListener('openMessaging', handleOpenMessaging as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };
  return (
    <div className="min-h-screen bg-[#1A1D23]">
      {/* Header */}
      <header className="bg-[#2A2D35] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-[#00D4FF]" />
              <div>
                <h1 className="text-xl font-bold text-white">Secura</h1>
                <p className="text-xs text-gray-400">👤 Employee Dashboard</p>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{userProfile?.full_name}</p>
                  <p className="text-xs text-gray-400">{userProfile?.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                    👤 Employee
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {userProfile?.full_name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-400">
            Report security incidents quickly and track their progress in real-time.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">My Open Incidents</p>
                <p className="text-3xl font-bold text-white">3</p>
                <p className="text-xs text-gray-500 mt-1">2 new this week</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Under Investigation</p>
                <p className="text-3xl font-bold text-white">1</p>
                <p className="text-xs text-gray-500 mt-1">Security team assigned</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Resolved This Month</p>
                <p className="text-3xl font-bold text-white">12</p>
                <p className="text-xs text-gray-500 mt-1">Average: 2.3 days</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <button
                onClick={() => setShowIncidentForm(true)}
                className="w-full bg-[#00D4FF] text-[#1A1D23] p-4 rounded-lg text-left transition-all hover:bg-[#00C4EF] hover:scale-105 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Report New Incident</h4>
                    <p className="text-sm opacity-80 mt-1">Submit a security incident report</p>
                  </div>
                  <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                </div>
              </button>
              
              <button className="w-full bg-[#374151] text-white p-4 rounded-lg text-left transition-all hover:bg-[#4B5563] hover:scale-105 group">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">View My Incidents</h4>
                    <p className="text-sm text-gray-300 mt-1">Track your submitted reports</p>
                  </div>
                  <FileText className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </div>
              </button>
              
              <button 
                onClick={() => setShowMessaging(true)}
                className="w-full bg-[#374151] text-white p-4 rounded-lg text-left transition-all hover:bg-[#4B5563] hover:scale-105 group relative"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Security Chat</h4>
                    <p className="text-sm text-gray-300 mt-1">Chat with security team</p>
                    <div className="flex items-center mt-1">
                      <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-xs text-gray-400">
                        {isConnected ? 'Connected' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{unreadCount}</span>
                      </span>
                    )}
                    <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Security Team Application Button */}
              {canApply && (
                <Link
                  href="/applications/apply"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg text-left transition-all hover:from-purple-700 hover:to-blue-700 hover:scale-105 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Join Security Team</h4>
                      <p className="text-sm text-gray-100 mt-1">Apply to become a security team member</p>
                    </div>
                    <UserCheck className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  </div>
                </Link>
              )}

              {/* Application Status Button */}
              <Link
                href="/applications/status"
                className="w-full bg-[#374151] text-white p-4 rounded-lg text-left transition-all hover:bg-[#4B5563] hover:scale-105 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Application Status</h4>
                    <p className="text-sm text-gray-300 mt-1">Track your security team applications</p>
                  </div>
                  <FileText className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-[#1A1D23] rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">Incident #INC-2024-001 resolved</p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-[#1A1D23] rounded-lg">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">Security team responded to #INC-2024-002</p>
                  <p className="text-xs text-gray-400">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-[#1A1D23] rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">New incident report submitted</p>
                  <p className="text-xs text-gray-400">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="mt-8 bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">🛡️ Security Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#1A1D23] rounded-lg">
              <h4 className="font-medium text-white mb-2">Recognize Phishing</h4>
              <p className="text-sm text-gray-400">Always verify sender identity before clicking links or downloading attachments.</p>
            </div>
            <div className="p-4 bg-[#1A1D23] rounded-lg">
              <h4 className="font-medium text-white mb-2">Report Suspicious Activity</h4>
              <p className="text-sm text-gray-400">When in doubt, report it. Better safe than sorry when it comes to security.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Incident Report Modal */}
      {showIncidentForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <IncidentReportForm onClose={() => setShowIncidentForm(false)} />
          </div>
        </div>
      )}

      {/* Messaging Modal */}
      {showMessaging && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl h-[600px]">
            <MessageThread onClose={() => setShowMessaging(false)} />
          </div>
        </div>
      )}
    </div>
  );
}