'use client';

import React from 'react';
import { 
  Shield, 
  TrendingUp, 
  Brain, 
  MessageSquare, 
  Bell, 
  LogOut,
  User
} from 'lucide-react';

interface SecurityHeaderProps {
  userProfile: any;
  unreadCount: number;
  isTeamLeader: () => boolean;
  onAnalyticsClick: () => void;
  onAIClick: () => void;
  onMessagingClick: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
}

export default function SecurityHeader({
  userProfile,
  unreadCount,
  isTeamLeader,
  onAnalyticsClick,
  onAIClick,
  onMessagingClick,
  onProfileClick,
  onLogout
}: SecurityHeaderProps) {
  return (
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
              onClick={onAnalyticsClick}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Analytics"
            >
              <TrendingUp className="h-5 w-5" />
            </button>
            
            <button 
              onClick={onAIClick}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="AI Analysis"
            >
              <Brain className="h-5 w-5" />
            </button>
            
            <button 
              onClick={onMessagingClick}
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

            {/* Profile Button */}
            <button 
              onClick={onProfileClick}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="My Profile"
            >
              <User className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{userProfile?.full_name}</p>
                <p className="text-xs text-gray-400">Security Analyst</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isTeamLeader() 
                    ? 'bg-yellow-500/20 text-yellow-300' 
                    : 'bg-orange-500/20 text-orange-300'
                }`}>
                  {isTeamLeader() ? '👑 Team Leader' : '🛡️ Security Team'}
                </span>
                <button
                  onClick={onLogout}
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
  );
}