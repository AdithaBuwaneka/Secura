'use client';

import React, { useState, useEffect } from 'react';
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
  X,
  Brain,
  Calendar,
  MapPin,
  User,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { logoutUser } from '@/store/auth/authSlice';
import SecurityMessaging from '@/components/messaging/SecurityMessaging';
import { useMessaging } from '@/components/messaging/MessagingProvider';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import AIAnalysisDashboard from '@/components/ai/AIAnalysisDashboard';
import toast from 'react-hot-toast';

export default function SecurityTeamDashboard() {
  const { userProfile, idToken } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const { unreadCount } = useMessaging();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMessaging, setShowMessaging] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    // Fetch incidents
    const fetchIncidents = async () => {
      if (idToken) {
        try {
          setLoading(true);
          const response = await fetch(`${API_URL}/api/incidents/`, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Security team fetched incidents:', data);
            console.log('First incident with attachments:', data.find((inc: any) => inc.attachments && inc.attachments.length > 0));
            setIncidents(data);
          }
        } catch (error) {
          console.error('Failed to fetch incidents:', error);
          toast.error('Failed to load incidents');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchIncidents();
    
    // Refresh incidents every 30 seconds
    const interval = setInterval(fetchIncidents, 30000);
    
    // Listen for WebSocket messages about new incidents
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_incident') {
          console.log('New incident notification received:', data);
          // Refresh incidents when a new one is reported
          fetchIncidents();
          toast.info(`New incident reported: ${data.title || 'Untitled'}`);
        }
      } catch (error) {
        // Ignore non-JSON messages
      }
    };
    
    // Add WebSocket listener if available
    const ws = (window as any).securaWebSocket;
    if (ws) {
      ws.addEventListener('message', handleWebSocketMessage);
    }
    
    return () => {
      clearInterval(interval);
      if (ws) {
        ws.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [idToken, API_URL]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
      case 'pending': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'investigating': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'assigned': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'closed': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };
  
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };
  
  // Filter incidents based on search term
  const filteredIncidents = incidents.filter(incident => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (incident.title?.toLowerCase().includes(searchLower) || false) ||
      (incident.description?.toLowerCase().includes(searchLower) || false) ||
      (incident.reporter_name?.toLowerCase().includes(searchLower) || false) ||
      (incident.incident_type?.toLowerCase().includes(searchLower) || false)
    );
  });

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
                onClick={() => setShowAI(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="AI Analysis"
              >
                <Brain className="h-5 w-5" />
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
        {incidents.filter(i => (i.severity === 'critical' || i.severity === 'high') && i.status !== 'resolved' && i.status !== 'closed').length > 0 && (
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 p-4 rounded-lg mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
                <div>
                  <p className="font-semibold text-red-200">Critical Incidents Require Attention</p>
                  <p className="text-sm text-red-300">
                    {incidents.filter(i => (i.severity === 'critical' || i.severity === 'high') && i.status !== 'resolved' && i.status !== 'closed').length} high-priority incidents need immediate investigation
                  </p>
                </div>
              </div>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Review Now
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Incidents</p>
                <p className="text-3xl font-bold text-white">{incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length}</p>
                <p className="text-xs text-gray-500 mt-1">Total open cases</p>
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
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF] mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading incidents...</p>
                  </div>
                ) : filteredIncidents.length > 0 ? (
                  filteredIncidents.map((incident) => {
                    const createdAt = new Date(incident.created_at);
                    const timeAgo = getTimeAgo(createdAt);
                    
                    return (
                      <div key={incident.id} className="bg-[#1A1D23] p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(incident.severity)}`}></div>
                            <div>
                              <p className="font-medium text-white">
                                {incident.title || incident.description?.substring(0, 60) + '...' || 'Untitled Incident'}
                              </p>
                              <p className="text-sm text-gray-400">
                                ID: {incident.id.substring(0, 8)}... • {timeAgo}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(incident.status)}`}>
                            {incident.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Reporter: {incident.reporter_name}</span>
                            <span>Type: {incident.incident_type || 'Uncategorized'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={async () => {
                                // Fetch the latest incident data including attachments
                                try {
                                  const response = await fetch(`${API_URL}/api/incidents/${incident.id}`, {
                                    headers: {
                                      'Authorization': `Bearer ${idToken}`
                                    }
                                  });
                                  
                                  if (response.ok) {
                                    const fullIncident = await response.json();
                                    console.log('Fetched full incident:', fullIncident);
                                    setSelectedIncident(fullIncident);
                                    setShowIncidentDetails(true);
                                  } else {
                                    // Fallback to existing data
                                    setSelectedIncident(incident);
                                    setShowIncidentDetails(true);
                                  }
                                } catch (error) {
                                  console.error('Failed to fetch incident details:', error);
                                  // Fallback to existing data
                                  setSelectedIncident(incident);
                                  setShowIncidentDetails(true);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-[#00D4FF] transition-colors" 
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-[#00D4FF] transition-colors" title="Message">
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No incidents found</p>
                  </div>
                )}
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

      {/* AI Analysis Modal */}
      {showAI && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl h-[90vh] overflow-y-auto bg-[#1A1D23] rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">AI Security Analysis</h2>
                <button
                  onClick={() => setShowAI(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <AIAnalysisDashboard />
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

      {/* Incident Details Modal */}
      {showIncidentDetails && selectedIncident && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1A1D23] rounded-lg">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Incident Details</h2>
                <button
                  onClick={() => {
                    setShowIncidentDetails(false);
                    setSelectedIncident(null);
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Incident ID and Status */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-400">Incident ID</p>
                  <p className="text-lg font-mono text-white">{selectedIncident.id}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedIncident.status)}`}>
                  {selectedIncident.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Title and Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {selectedIncident.title || 'Untitled Incident'}
                </h3>
                <p className="text-gray-300 whitespace-pre-wrap">
                  {selectedIncident.description || 'No description provided'}
                </p>
              </div>

              {/* Severity and Type */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Severity</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(selectedIncident.severity)}`}></div>
                    <span className="text-white font-medium">
                      {selectedIncident.severity.charAt(0).toUpperCase() + selectedIncident.severity.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Incident Type</p>
                  <p className="text-white font-medium">
                    {selectedIncident.incident_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Uncategorized'}
                  </p>
                </div>
              </div>

              {/* Reporter Information */}
              <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700 mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Reporter Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-white">{selectedIncident.reporter_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-white">{selectedIncident.reporter_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-white">{selectedIncident.reporter_department || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reported</p>
                    <p className="text-white">{new Date(selectedIncident.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              {selectedIncident.location && (
                <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700 mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </h4>
                  <p className="text-white">
                    {selectedIncident.location.address || selectedIncident.location.building || 'No specific location'}
                  </p>
                </div>
              )}

              {/* Attachments */}
              {console.log('Selected incident:', selectedIncident)}
              {console.log('Selected incident attachments:', selectedIncident.attachments)}
              {selectedIncident.attachments && selectedIncident.attachments.length > 0 && (
                <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700 mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attachments ({selectedIncident.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedIncident.attachments.map((attachment: any, index: number) => {
                      const isImage = attachment.file_type?.startsWith('image/') || 
                                     attachment.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      
                      return (
                        <div key={index} className="bg-[#1A1D23] p-3 rounded-lg border border-gray-700">
                          <div className="flex items-start space-x-3">
                            {isImage ? (
                              <ImageIcon className="h-5 w-5 text-blue-400 mt-1" />
                            ) : (
                              <FileText className="h-5 w-5 text-gray-400 mt-1" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm text-white font-medium">
                                {attachment.original_filename || attachment.filename || `Attachment ${index + 1}`}
                              </p>
                              <p className="text-xs text-gray-400">
                                {attachment.file_size ? `${(attachment.file_size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                              </p>
                              {isImage && attachment.file_url && (
                                <div className="mt-2">
                                  <img 
                                    src={attachment.file_url} 
                                    alt={attachment.original_filename || 'Attachment'}
                                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(attachment.file_url, '_blank')}
                                  />
                                </div>
                              )}
                            </div>
                            {attachment.file_url && (
                              <button
                                onClick={() => window.open(attachment.file_url, '_blank')}
                                className="p-2 text-gray-400 hover:text-[#00D4FF] transition-colors"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700 mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Timeline
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-white">{new Date(selectedIncident.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Updated</span>
                    <span className="text-white">{new Date(selectedIncident.updated_at).toLocaleString()}</span>
                  </div>
                  {selectedIncident.resolved_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Resolved</span>
                      <span className="text-white">{new Date(selectedIncident.resolved_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowIncidentDetails(false);
                    setSelectedIncident(null);
                  }}
                  className="px-6 py-3 bg-[#374151] hover:bg-[#4B5563] text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button className="px-6 py-3 bg-[#00D4FF] hover:bg-[#00C4EF] text-[#1A1D23] font-medium rounded-lg transition-colors">
                  Assign to Me
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}