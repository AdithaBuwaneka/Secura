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
import IncidentReportForm from '@/components/forms/IncidentReportForm';
import MessageThread from '@/components/messaging/MessageThread';
import { useMessaging } from '@/components/messaging/MessagingProvider';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const { userProfile, idToken } = useSelector((state: RootState) => state.auth);
  const { canApply } = useSelector((state: RootState) => state.applications);
  const dispatch = useDispatch<AppDispatch>();
  const { unreadCount, isConnected } = useMessaging();
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [myIncidents, setMyIncidents] = useState<any[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // Fetch user's incidents
  const fetchMyIncidents = async () => {
    if (idToken) {
      try {
        const response = await fetch(`${API_URL}/api/incidents/?limit=10`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        if (response.ok) {
          const incidents = await response.json();
          console.log('Employee Dashboard - Fetched incidents:', incidents);
          setMyIncidents(incidents);
        } else {
          console.error('Failed to fetch incidents:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error details:', errorText);
        }
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      }
    }
  };

  useEffect(() => {
    dispatch(checkCanApply());
    fetchMyIncidents();
    
    // Refresh incidents every 30 seconds
    const interval = setInterval(() => {
      fetchMyIncidents();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [dispatch, idToken, API_URL]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };
  
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  };
  
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return { color: 'bg-green-400', text: 'resolved' };
      case 'investigating':
      case 'in_progress':
        return { color: 'bg-orange-400', text: 'being investigated' };
      case 'new':
      case 'pending':
        return { color: 'bg-blue-400', text: 'submitted' };
      default:
        return { color: 'bg-gray-400', text: 'updated' };
    }
  };
  
  // Calculate stats
  const openIncidents = myIncidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length;
  const investigatingIncidents = myIncidents.filter(i => i.status === 'investigating' || i.status === 'in_progress').length;
  const resolvedThisMonth = myIncidents.filter(i => {
    if (i.status !== 'resolved' && i.status !== 'closed') return false;
    const resolvedDate = new Date(i.resolved_at || i.updated_at);
    const now = new Date();
    return resolvedDate.getMonth() === now.getMonth() && resolvedDate.getFullYear() === now.getFullYear();
  }).length;
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
                <p className="text-3xl font-bold text-white">{openIncidents}</p>
                <p className="text-xs text-gray-500 mt-1">Active reports</p>
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
                <p className="text-3xl font-bold text-white">{investigatingIncidents}</p>
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
                <p className="text-3xl font-bold text-white">{resolvedThisMonth}</p>
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
            <div className="space-y-4">
              {myIncidents.length > 0 ? (
                myIncidents.slice(0, 5).map((incident) => {
                  const statusInfo = getStatusIcon(incident.status);
                  const timeAgo = getTimeAgo(new Date(incident.updated_at || incident.created_at));
                  
                  return (
                    <div key={incident.id} className="flex items-center space-x-3 p-3 bg-[#1A1D23] rounded-lg">
                      <div className={`w-2 h-2 ${statusInfo.color} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          Incident: {incident.title || incident.description?.substring(0, 40) + '...' || 'Untitled'} {statusInfo.text}
                        </p>
                        <p className="text-xs text-gray-400">
                          {incident.severity.toUpperCase()} • {timeAgo}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No recent incidents</p>
                  <p className="text-gray-500 text-xs mt-1">Your reported incidents will appear here</p>
                </div>
              )}
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
            <IncidentReportForm 
              onClose={() => setShowIncidentForm(false)} 
              onSuccess={() => {
                // Refresh incidents after successful submission
                fetchMyIncidents();
              }}
            />
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