'use client';

import React from 'react';
import { Shield, AlertTriangle, Users, TrendingUp } from 'lucide-react';

interface SecurityTeamDashboardProps {
  user: {
    name: string;
    role: string;
    department: string;
  };
}

export default function SecurityTeamDashboard({ user }: SecurityTeamDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-cyan-400" />
            <div>
              <h1 className="text-xl font-semibold">🛡️ Security Team Dashboard</h1>
              <p className="text-gray-400">Investigate and resolve incidents</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-400">Security Analyst</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Priority Alerts */}
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div>
              <p className="font-medium text-red-200">Critical Incident Alert</p>
              <p className="text-sm text-red-300">2 high-priority incidents require immediate attention</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Stats */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Incidents</p>
                <p className="text-2xl font-bold">27</p>
              </div>
              <div className="h-2 w-2 bg-red-400 rounded-full"></div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Under Investigation</p>
                <p className="text-2xl font-bold">15</p>
              </div>
              <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Team Members</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Resolution</p>
                <p className="text-2xl font-bold">4.2h</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>

        {/* Incident Queue */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Incident Queue</h2>
          <div className="space-y-3">
            {[
              { id: 'INC-001', title: 'Phishing Email Reported', severity: 'High', time: '2 min ago', status: 'New' },
              { id: 'INC-002', title: 'Suspicious Network Activity', severity: 'Critical', time: '5 min ago', status: 'Investigating' },
              { id: 'INC-003', title: 'Malware Detection Alert', severity: 'Medium', time: '12 min ago', status: 'Assigned' },
            ].map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`h-3 w-3 rounded-full ${
                    incident.severity === 'Critical' ? 'bg-red-400' :
                    incident.severity === 'High' ? 'bg-orange-400' : 'bg-yellow-400'
                  }`}></div>
                  <div>
                    <p className="font-medium">{incident.title}</p>
                    <p className="text-sm text-gray-400">{incident.id} • {incident.time}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-cyan-600 text-cyan-100 rounded-full text-sm">
                  {incident.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}