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
  Bell,
  UserCheck
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { logoutUser } from '@/store/auth/authSlice';
import { checkCanApply } from '@/store/applications/applicationSlice';
import { fetchUserIncidents } from '@/store/incidents/incidentSlice';
import IncidentReportForm from '@/components/forms/IncidentReportForm';
import MessageThread from '@/components/messaging/MessageThread';
import { useMessaging } from '@/components/messaging/MessagingProvider';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const { userProfile, idToken, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { canApply } = useSelector((state: RootState) => state.applications);
  const { userIncidents, stats, loading } = useSelector((state: RootState) => state.incidents);
  const dispatch = useDispatch<AppDispatch>();
  const { unreadCount, isConnected } = useMessaging();
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);

  useEffect(() => {
    // Only fetch data when user is authenticated and has idToken
    if (isAuthenticated && idToken && userProfile) {
      console.log('Dashboard: Fetching data for authenticated user');
      dispatch(checkCanApply());
      dispatch(fetchUserIncidents());
    } else {
      console.log('Dashboard: User not fully authenticated yet', { isAuthenticated, hasToken: !!idToken, hasProfile: !!userProfile });
    }
  }, [dispatch, isAuthenticated, idToken, userProfile]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleIncidentFormClose = () => {
    setShowIncidentForm(false);
    // Refresh incidents after form submission
    dispatch(fetchUserIncidents());
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
              <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadCount}</span>
                  </span>
                )}
              </button>
              
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
                <p className="text-3xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.total} total incidents</p>
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
                <p className="text-3xl font-bold text-white">{stats.investigating}</p>
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
                <p className="text-gray-400 text-sm">Resolved Total</p>
                <p className="text-3xl font-bold text-white">{stats.resolved}</p>
                <p className="text-xs text-gray-500 mt-1">Successfully handled</p>
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
            <div className="space-y-3">
              <button
                onClick={() => setShowIncidentForm(true)}
                className="w-full bg-[#00D4FF] text-[#1A1D23] p-4 rounded-lg text-left transition-all hover:bg-[#00C4EF] hover:scale-[1.02] hover:shadow-lg group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Report New Incident</h4>
                    <p className="text-sm opacity-80 mt-1">Submit a security incident report</p>
                  </div>
                  <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                </div>
              </button>
              
              <button className="w-full bg-[#374151] text-white p-4 rounded-lg text-left transition-all hover:bg-[#4B5563] hover:scale-[1.02] hover:shadow-lg group">
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
                className="w-full bg-[#374151] text-white p-4 rounded-lg text-left transition-all hover:bg-[#4B5563] hover:scale-[1.02] hover:shadow-lg group relative overflow-visible"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium">Security Chat</h4>
                    <p className="text-sm text-gray-300 mt-1">Chat with security team</p>
                    <div className="flex items-center mt-1">
                      <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-xs text-gray-400">
                        {isConnected ? 'Connected' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0 ml-4">
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center z-10 text-xs text-white font-bold min-w-[16px]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    <MessageCircle className="h-6 w-6 text-gray-300 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </button>

              {/* Security Team Application Button */}
              {canApply && (
                <Link
                  href="/applications/apply"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg text-left transition-all hover:from-purple-700 hover:to-blue-700 hover:scale-[1.02] hover:shadow-lg group block"
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
                className="w-full bg-[#374151] text-white p-4 rounded-lg text-left transition-all hover:bg-[#4B5563] hover:scale-[1.02] hover:shadow-lg group block"
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]"></div>
              </div>
            ) : userIncidents.length > 0 ? (
              <div className="space-y-4">
                {userIncidents.slice(0, 5).map((incident) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'resolved': case 'closed': return 'bg-green-400';
                      case 'investigating': return 'bg-orange-400';
                      case 'pending': return 'bg-yellow-400';
                      default: return 'bg-gray-400';
                    }
                  };

                  const getTimeAgo = (dateString: string) => {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
                    
                    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
                    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
                    return `${Math.floor(diffInMinutes / 1440)} days ago`;
                  };

                  return (
                    <div key={incident.id} className="flex items-center space-x-3 p-3 bg-[#1A1D23] rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(incident.status)}`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          {incident.status === 'resolved' || incident.status === 'closed' 
                            ? `Incident "${incident.title}" resolved`
                            : incident.status === 'investigating'
                            ? `Security team investigating "${incident.title}"`
                            : `New incident "${incident.title}" submitted`
                          }
                        </p>
                        <p className="text-xs text-gray-400">{getTimeAgo(incident.updated_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No incidents reported yet</p>
                <p className="text-sm text-gray-500 mt-1">Submit your first incident report above</p>
              </div>
            )}
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
            <IncidentReportForm onClose={handleIncidentFormClose} />
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