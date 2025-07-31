'use client';

import React from 'react';
import { 
  AlertCircle, 
  Clock, 
  Users, 
  CheckCircle2 
} from 'lucide-react';

interface SecurityStatsGridProps {
  incidents: any[];
  onlineTeamMembers: number;
  totalTeamMembers: number;
  onTeamDetailsClick: () => void;
}

export default function SecurityStatsGrid({
  incidents,
  onlineTeamMembers,
  totalTeamMembers,
  onTeamDetailsClick
}: SecurityStatsGridProps) {
  // Calculate stats
  const underInvestigationCount = incidents.filter(i => 
    i.status === 'investigating' || i.status === 'in_progress'
  ).length;

  const resolvedTodayCount = incidents.filter(i => {
    if (i.status !== 'resolved' && i.status !== 'closed') return false;
    const resolvedDate = new Date(i.resolved_at || i.updated_at);
    const today = new Date();
    return resolvedDate.toDateString() === today.toDateString();
  }).length;

  const activeIncidentsCount = incidents.filter(i => 
    i.status !== 'resolved' && i.status !== 'closed'
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Active Incidents</p>
            <p className="text-3xl font-bold text-white">{activeIncidentsCount}</p>
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
            <p className="text-3xl font-bold text-white">{underInvestigationCount}</p>
            <p className="text-xs text-gray-500 mt-1">Active investigations</p>
          </div>
          <div className="p-3 bg-orange-500/20 rounded-lg">
            <Clock className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>
      
      <div 
        className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700 cursor-pointer hover:bg-[#2E3139] hover:border-gray-600 transition-all duration-200"
        onClick={onTeamDetailsClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Team Online</p>
            <p className="text-3xl font-bold text-white">{onlineTeamMembers}/{totalTeamMembers}</p>
            <p className="text-xs text-gray-500 mt-1">Click to view details</p>
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
            <p className="text-3xl font-bold text-white">{resolvedTodayCount}</p>
            <p className="text-xs text-gray-500 mt-1">Completed today</p>
          </div>
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <CheckCircle2 className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
}