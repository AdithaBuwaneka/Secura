'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useMessaging } from '@/components/messaging/MessagingProvider';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'message' | 'incident' | 'alert' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function NotificationDropdown() {
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const { unreadCount } = useMessaging();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Handle different notification types
    switch (notification.type) {
      case 'message':
        // Open messaging section
        openMessagingSection();
        break;
      case 'incident':
        // Open incident details (if you have an incident ID)
        if (notification.id.includes('INC-')) {
          openIncidentDetails(notification.id);
        }
        break;
      case 'alert':
        // Show alert details or open security dashboard
        openSecurityDashboard();
        break;
      case 'system':
        // Show system notification details
        showSystemNotification(notification);
        break;
    }
    
    // Close dropdown
    setIsOpen(false);
  };

  // Function to open messaging section
  const openMessagingSection = () => {
    // Dispatch an action to open messaging modal
    // You can customize this based on your app's state management
    const event = new CustomEvent('openMessaging', {
      detail: { source: 'notification' }
    });
    window.dispatchEvent(event);
    
    // Alternative: Use toast to show messaging is available
    toast.success('Opening messaging section...', {
      duration: 2000,
    });
  };

  // Function to open incident details
  const openIncidentDetails = (incidentId: string) => {
    // Navigate to incident details page
    window.location.href = `/incidents/${incidentId}`;
  };

  // Function to open security dashboard
  const openSecurityDashboard = () => {
    // Navigate to security dashboard
    window.location.href = '/dashboard';
  };

  // Function to show system notification details
  const showSystemNotification = (notification: Notification) => {
    toast.info(notification.message, {
      duration: 5000,
    });
  };

  // Mock notifications for demonstration
  useEffect(() => {
    // Get user role to show appropriate notifications
    const userRole = userProfile?.role || 'employee';
    
    let mockNotifications: Notification[] = [];
    
    if (userRole === 'employee') {
      // Employees should only see their own incident updates and messages from security team
      mockNotifications = [
        {
          id: '1',
          type: 'message',
          title: 'New Message',
          message: 'Security team sent you a message about incident INC-2024-001',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          read: false,
          priority: 'medium'
        },
        {
          id: '2',
          type: 'alert',
          title: 'Security Alert',
          message: 'Multiple failed login attempts detected',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: true,
          priority: 'critical'
        },
        {
          id: '3',
          type: 'system',
          title: 'System Update',
          message: 'System maintenance completed successfully',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true,
          priority: 'low'
        }
      ];
    } else if (userRole === 'security_team') {
      // Security team sees new incidents, assignments, and security alerts
      mockNotifications = [
        {
          id: '1',
          type: 'incident',
          title: 'New Incident Reported',
          message: 'John Doe reported a suspicious email incident',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false,
          priority: 'high'
        },
        {
          id: '2',
          type: 'message',
          title: 'New Message',
          message: 'Employee sent a message about incident INC-2024-001',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          read: false,
          priority: 'medium'
        },
        {
          id: '3',
          type: 'alert',
          title: 'Security Alert',
          message: 'Multiple failed login attempts detected',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: true,
          priority: 'critical'
        },
        {
          id: '4',
          type: 'system',
          title: 'System Health',
          message: 'System performance monitoring active',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true,
          priority: 'low'
        }
      ];
    } else if (userRole === 'admin') {
      // Admin sees everything
      mockNotifications = [
        {
          id: '1',
          type: 'incident',
          title: 'New Incident Reported',
          message: 'John Doe reported a suspicious email incident',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false,
          priority: 'high'
        },
        {
          id: '2',
          type: 'message',
          title: 'New Message',
          message: 'Security team sent you a message about incident INC-2024-001',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          read: false,
          priority: 'medium'
        },
        {
          id: '3',
          type: 'alert',
          title: 'Security Alert',
          message: 'Multiple failed login attempts detected',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: true,
          priority: 'critical'
        },
        {
          id: '4',
          type: 'system',
          title: 'User Management',
          message: 'New user registration completed',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true,
          priority: 'low'
        }
      ];
    }
    
    setNotifications(mockNotifications);
  }, [userProfile?.role]);

  // Add real-time notifications from WebSocket
  const addRealTimeNotification = (type: string, title: string, message: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    const newNotification: Notification = {
      id: `rt_${Date.now()}`,
      type: type as any,
      title,
      message,
      timestamp: new Date(),
      read: false,
      priority
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Listen for real-time notifications (you can integrate this with your WebSocket)
  useEffect(() => {
    // Example: Add a test notification every 30 seconds for demonstration
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 30 seconds
        const types = ['incident', 'message', 'alert', 'system'];
        const type = types[Math.floor(Math.random() * types.length)];
        const titles = [
          'New Security Alert',
          'System Update',
          'Incident Update',
          'Message Received'
        ];
        const title = titles[Math.floor(Math.random() * titles.length)];
        addRealTimeNotification(type, title, `Real-time notification: ${title.toLowerCase()}`);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.read);
  const totalUnread = unreadNotifications.length + unreadCount;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case 'incident':
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'system':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-white transition-colors relative"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#2A2D35] border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadNotifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00D4FF]"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-gray-400">
                <Bell className="h-8 w-8 mb-2" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-[#1A1D23] transition-colors cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read ? 'bg-[#1A1D23]/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700 bg-[#1A1D23]">
              <button className="w-full text-xs text-gray-400 hover:text-white transition-colors">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}