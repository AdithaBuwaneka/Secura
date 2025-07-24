'use client';

import React from 'react';
import { User, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface EmployeeDashboardProps {
  user: {
    name: string;
    role: string;
    department: string;
  };
}

export default function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <User className="h-8 w-8 text-cyan-400" />
            <div>
              <h1 className="text-xl font-semibold">👤 Employee Dashboard</h1>
              <p className="text-gray-400">Report incidents easily</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-400">{user.department}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Open Incidents</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Review</p>
                <p className="text-2xl font-bold">1</p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Resolved</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-cyan-600 hover:bg-cyan-700 p-4 rounded-lg text-left transition-colors">
              <h3 className="font-medium">Report New Incident</h3>
              <p className="text-sm text-cyan-100 mt-1">Submit a security incident report</p>
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-left transition-colors">
              <h3 className="font-medium">View My Incidents</h3>
              <p className="text-sm text-gray-300 mt-1">Track your submitted reports</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}