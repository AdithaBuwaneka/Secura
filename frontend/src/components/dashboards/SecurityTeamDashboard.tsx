'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Search,
  Filter,
  Bell,
  LogOut,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { logoutUser } from '@/store/auth/authSlice';
import SecurityMessaging from '@/components/messaging/SecurityMessaging';
import { useMessaging } from '@/components/messaging/MessagingProvider';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import toast from 'react-hot-toast';

export default function SecurityTeamDashboard() {
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const { unreadCount } = useMessaging();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMessaging, setShowMessaging] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };
  const mockIncidents = [
    { id: 'INC-2024-001', title: 'Phishing Email Campaign Detected', severity: 'Critical', time: '2 min ago', status: 'Investigating', reporter: 'John Doe', category: 'Phishing' },
    { id: 'INC-2024-002', title: 'Unusual Network Traffic Patterns', severity: 'High', time: '15 min ago', status: 'New', reporter: 'Sarah Wilson', category: 'Network' },
    { id: 'INC-2024-003', title: 'Malware Detection on Workstation', severity: 'High', time: '32 min ago', status: 'Assigned', reporter: 'Mike Johnson', category: 'Malware' },
    { id: 'INC-2024-004', title: 'Unauthorized Access Attempt', severity: 'Medium', time: '1 hour ago', status: 'In Progress', reporter: 'Emily Chen', category: 'Access' },
    { id: 'INC-2024-005', title: 'Suspicious Email Attachment', severity: 'Low', time: '2 hours ago', status: 'Resolved', reporter: 'David Kim', category: 'Email' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Investigating': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Assigned': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'In Progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Resolved': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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
                <p className="text-xs text-gray-400">🛡️ Security Team Dashboard</p>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowAnalytics(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Analytics"
              >
                <TrendingUp className="h-5 w-5" />
              </button>
              
              <button 
                onClick={() => setShowMessaging(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors relative"
                title="Messages"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadCount}</span>
                  </span>
                )}
              </button>
              
              <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">3</span>
                </span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{userProfile?.full_name}</p>
                  <p className="text-xs text-gray-400">Security Analyst</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                    🛡️ Security Team
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
        {/* Critical Alert Banner */}
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 p-4 rounded-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
              <div>
                <p className="font-semibold text-red-200">Critical Incidents Require Attention</p>
                <p className="text-sm text-red-300">2 high-priority incidents need immediate investigation</p>
              </div>
            </div>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Review Now
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Incidents</p>
                <p className="text-3xl font-bold text-white">27</p>
                <p className="text-xs text-gray-500 mt-1">↑ 3 from yesterday</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Under Investigation</p>
                <p className="text-3xl font-bold text-white">15</p>
                <p className="text-xs text-gray-500 mt-1">Avg: 2.1 hours</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Team Online</p>
                <p className="text-3xl font-bold text-white">6/8</p>
                <p className="text-xs text-gray-500 mt-1">Available analysts</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Resolved Today</p>
                <p className="text-3xl font-bold text-white">18</p>
                <p className="text-xs text-gray-500 mt-1">Target: 20</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Incident Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Incident Queue */}
          <div className="lg:col-span-2">
            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Incident Queue</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search incidents..."
                      className="pl-10 pr-4 py-2 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF] text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="p-2 bg-[#1A1D23] border border-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Filter className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {mockIncidents.map((incident) => (
                  <div key={incident.id} className="bg-[#1A1D23] p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(incident.severity)}`}></div>
                        <div>
                          <p className="font-medium text-white">{incident.title}</p>
                          <p className="text-sm text-gray-400">{incident.id} • {incident.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Reporter: {incident.reporter}</span>
                        <span>Category: {incident.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-[#00D4FF] transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-[#00D4FF] transition-colors">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* AI Analysis */}
            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">🤖 AI Insights</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm font-medium text-blue-300">Threat Pattern Detected</p>
                  <p className="text-xs text-blue-400 mt-1">Similar phishing attempts from 3 different sources</p>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm font-medium text-yellow-300">Recommendation</p>
                  <p className="text-xs text-yellow-400 mt-1">Consider blocking domain: suspicious-site.com</p>
                </div>
              </div>
            </div>

            {/* Team Status */}
            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Team Status</h3>
              <div className="space-y-3">
                {[
                  { name: 'Alex Chen', status: 'Available', workload: 3 },
                  { name: 'Sarah Kim', status: 'Investigating', workload: 5 },
                  { name: 'Mike Johnson', status: 'Available', workload: 2 },
                  { name: 'Emma Wilson', status: 'Busy', workload: 7 },
                ].map((member) => (
                  <div key={member.name} className="flex items-center justify-between p-2 bg-[#1A1D23] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.workload} active cases</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${
                      member.status === 'Available' ? 'bg-green-400' :
                      member.status === 'Investigating' ? 'bg-orange-400' : 'bg-red-400'
                    }`}></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-7xl h-[90vh] overflow-y-auto bg-[#1A1D23] rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Security Analytics</h2>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <AnalyticsDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Messaging Modal */}
      {showMessaging && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl h-[80vh]">
            <SecurityMessaging onClose={() => setShowMessaging(false)} />
          </div>
        </div>
      )}
    </div>
  );
}