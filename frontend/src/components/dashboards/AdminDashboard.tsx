'use client';

import React from 'react';
import { Settings, Users, BarChart3, Shield } from 'lucide-react';

interface AdminDashboardProps {
  user: {
    name: string;
    role: string;
    department: string;
  };
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Settings className="h-8 w-8 text-cyan-400" />
            <div>
              <h1 className="text-xl font-semibold">🔑 Admin Dashboard</h1>
              <p className="text-gray-400">Manage system and users</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-400">System Administrator</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Executive Stats */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <Users className="h-8 w-8 text-cyan-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Security Team</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Shield className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Monthly Incidents</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Health</p>
                <p className="text-2xl font-bold text-green-400">98.5%</p>
              </div>
              <div className="h-3 w-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Management */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-cyan-400" />
              User Management
            </h2>
            <div className="space-y-3">
              <button className="w-full bg-cyan-600 hover:bg-cyan-700 p-3 rounded-lg text-left transition-colors">
                <h3 className="font-medium">Manage Security Team</h3>
                <p className="text-sm text-cyan-100 mt-1">Add/remove security personnel</p>
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-left transition-colors">
                <h3 className="font-medium">Department Assignment</h3>
                <p className="text-sm text-gray-300 mt-1">Assign users to departments</p>
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-left transition-colors">
                <h3 className="font-medium">User Permissions</h3>
                <p className="text-sm text-gray-300 mt-1">Configure access levels</p>
              </button>
            </div>
          </div>

          {/* System Configuration */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-cyan-400" />
              System Configuration
            </h2>
            <div className="space-y-3">
              <button className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-left transition-colors">
                <h3 className="font-medium">Executive Reports</h3>
                <p className="text-sm text-gray-300 mt-1">Generate compliance reports</p>
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-left transition-colors">
                <h3 className="font-medium">System Settings</h3>
                <p className="text-sm text-gray-300 mt-1">Configure system parameters</p>
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-left transition-colors">
                <h3 className="font-medium">Audit Logs</h3>
                <p className="text-sm text-gray-300 mt-1">View system audit trails</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}