'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Settings, 
  Users, 
  BarChart3, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  Bell,
  LogOut,
  UserPlus,
  Download,
  Activity,
  Database,
  ClipboardList
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { logoutUser } from '@/store/auth/authSlice';
import { fetchPendingApplications } from '@/store/applications/applicationSlice';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import AdminApplicationReview from '@/components/applications/AdminApplicationReview';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { userProfile, idToken } = useSelector((state: RootState) => state.auth);
  const { pendingApplications } = useSelector((state: RootState) => state.applications);
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState('overview');
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    dispatch(fetchPendingApplications());
    
    // Fetch recent incidents
    const fetchRecentIncidents = async () => {
      if (idToken) {
        try {
          const response = await fetch(`${API_URL}/api/incidents/?limit=5`, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          
          if (response.ok) {
            const incidents = await response.json();
            setRecentIncidents(incidents);
          }
        } catch (error) {
          console.error('Failed to fetch recent incidents:', error);
        }
      }
    };
    
    fetchRecentIncidents();
  }, [dispatch, idToken, API_URL]);

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
                <p className="text-xs text-gray-400">🔑 Admin Dashboard</p>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">5</span>
                </span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{userProfile?.full_name}</p>
                  <p className="text-xs text-gray-400">System Administrator</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                    🔑 {userProfile?.role === 'admin' ? 'Admin' : 'Executive'}
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

      {/* Navigation Tabs */}
      <div className="bg-[#2A2D35] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'applications', label: `Applications ${pendingApplications.length > 0 ? `(${pendingApplications.length})` : ''}`, icon: ClipboardList },
              { id: 'system', label: 'System Config', icon: Settings },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#00D4FF] text-[#00D4FF]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Executive Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-white">1,247</p>
                    <p className="text-xs text-gray-500 mt-1">↑ 23 this month</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="h-8 w-8 text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Security Team</p>
                    <p className="text-3xl font-bold text-white">12</p>
                    <p className="text-xs text-gray-500 mt-1">8 active analysts</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Shield className="h-8 w-8 text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Monthly Incidents</p>
                    <p className="text-3xl font-bold text-white">89</p>
                    <p className="text-xs text-gray-500 mt-1">↓ 12% from last month</p>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-orange-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending Applications</p>
                    <p className="text-3xl font-bold text-white">{pendingApplications.length}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pendingApplications.length === 0 ? 'All reviewed' : 'Awaiting review'}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <ClipboardList className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">System Health</p>
                    <p className="text-3xl font-bold text-green-400">98.5%</p>
                    <p className="text-xs text-gray-500 mt-1">All systems operational</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Activity className="h-8 w-8 text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Management */}
              <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-[#00D4FF]" />
                  User Management
                </h3>
                <div className="space-y-4">
                  <button className="w-full bg-[#00D4FF] text-[#1A1D23] p-4 rounded-lg text-left transition-all hover:bg-[#00C4EF] hover:scale-105 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Manage Security Team</h4>
                        <p className="text-sm opacity-80 mt-1">Add/remove security personnel</p>
                      </div>
                      <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('applications')}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg text-left transition-all hover:from-purple-700 hover:to-blue-700 hover:scale-105 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Review Applications</h4>
                        <p className="text-sm text-gray-100 mt-1">
                          {pendingApplications.length > 0 
                            ? `${pendingApplications.length} pending review` 
                            : 'No pending applications'}
                        </p>
                      </div>
                      <div className="relative">
                        {pendingApplications.length > 0 && (
                          <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">{pendingApplications.length}</span>
                          </span>
                        )}
                        <ClipboardList className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full bg-[#374151] text-white p-4 rounded-lg text-left transition-all hover:bg-[#4B5563] hover:scale-105 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">User Permissions</h4>
                        <p className="text-sm text-gray-300 mt-1">Configure access levels</p>
                      </div>
                      <Settings className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>

              {/* System Configuration */}
              <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-[#00D4FF]" />
                  System Configuration
                </h3>
                <div className="space-y-4">
                  <button className="w-full bg-[#374151] text-white p-4 rounded-lg text-left transition-all hover:bg-[#4B5563] hover:scale-105 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Executive Reports</h4>
                        <p className="text-sm text-gray-300 mt-1">Generate compliance reports</p>
                      </div>
                      <Download className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                  
                  <button className="w-full bg-[#374151] text-white p-4 rounded-lg text-left transition-all hover:bg-[#4B5563] hover:scale-105 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">System Settings</h4>
                        <p className="text-sm text-gray-300 mt-1">Configure system parameters</p>
                      </div>
                      <Database className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                  
                  <button className="w-full bg-[#374151] text-white p-4 rounded-lg text-left transition-all hover:bg-[#4B5563] hover:scale-105 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Audit Logs</h4>
                        <p className="text-sm text-gray-300 mt-1">View system audit trails</p>
                      </div>
                      <Activity className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Recent System Activity</h3>
                <button className="text-[#00D4FF] hover:underline text-sm">View All</button>
              </div>
              <div className="space-y-4">
                {[
                  { action: 'New user registered', user: 'Sarah Wilson', time: '5 minutes ago', type: 'success' },
                  { action: 'Security team member added', user: 'Admin', time: '1 hour ago', type: 'info' },
                  { action: 'System backup completed', user: 'System', time: '2 hours ago', type: 'success' },
                  { action: 'Failed login attempt detected', user: 'Security Monitor', time: '3 hours ago', type: 'warning' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-[#1A1D23] rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-400' :
                      activity.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.action}</p>
                      <p className="text-xs text-gray-400">By {activity.user} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Other tab content would go here */}
        {activeTab !== 'overview' && (
          <div>
            {activeTab === 'users' && (
              <div className="bg-[#2A2D35] p-8 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-400">User Management interface would be implemented here</p>
              </div>
            )}
            {activeTab === 'applications' && <AdminApplicationReview />}
            {activeTab === 'system' && (
              <div className="bg-[#2A2D35] p-8 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-400">System Configuration panel would be implemented here</p>
              </div>
            )}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
          </div>
        )}
      </main>
    </div>
  );
}