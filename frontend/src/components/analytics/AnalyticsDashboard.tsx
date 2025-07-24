'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Download,
  RefreshCw,
  Activity,
  Clock,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { RootState } from '@/store';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import IncidentMetrics from './IncidentMetrics';
import SecurityReports from './SecurityReports';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  incident_trends: {
    labels: string[];
    data: number[];
  };
  severity_distribution: {
    labels: string[];
    data: number[];
  };
  response_times: {
    labels: string[];
    data: number[];
  };
  team_performance: {
    labels: string[];
    data: number[];
  };
  monthly_summary: {
    total_incidents: number;
    resolved_incidents: number;
    avg_response_time: number;
    critical_incidents: number;
  };
}

export default function AnalyticsDashboard(): React.JSX.Element {
  const { idToken } = useSelector((state: RootState) => state.auth);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState('charts');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const loadAnalyticsData = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_URL}/api/analytics/dashboard/basic?days=${selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : selectedTimeRange === '90d' ? 90 : 365}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        // Use mock data if API fails
        setAnalyticsData(mockAnalyticsData);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      setAnalyticsData(mockAnalyticsData);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedTimeRange, idToken, API_URL]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Mock data for development
  const mockAnalyticsData: AnalyticsData = {
    incident_trends: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      data: [23, 45, 32, 67]
    },
    severity_distribution: {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      data: [8, 25, 42, 33]
    },
    response_times: {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      data: [0.5, 2.1, 4.3, 8.7]
    },
    team_performance: {
      labels: ['Alex Chen', 'Sarah Kim', 'Mike Johnson', 'Emma Wilson', 'David Lee'],
      data: [34, 28, 31, 25, 29]
    },
    monthly_summary: {
      total_incidents: 167,
      resolved_incidents: 142,
      avg_response_time: 3.8,
      critical_incidents: 8
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#E5E7EB'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: '#374151'
        }
      }
    }
  };

  const incidentTrendsData = {
    labels: analyticsData?.incident_trends.labels || [],
    datasets: [
      {
        label: 'Incidents',
        data: analyticsData?.incident_trends.data || [],
        borderColor: '#00D4FF',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const severityDistributionData = {
    labels: analyticsData?.severity_distribution.labels || [],
    datasets: [
      {
        data: analyticsData?.severity_distribution.data || [],
        backgroundColor: [
          '#EF4444', // Critical - Red
          '#F97316', // High - Orange
          '#EAB308', // Medium - Yellow
          '#22C55E'  // Low - Green
        ],
        borderWidth: 0
      }
    ]
  };

  const responseTimesData = {
    labels: analyticsData?.response_times.labels || [],
    datasets: [
      {
        label: 'Avg Response Time (hours)',
        data: analyticsData?.response_times.data || [],
        backgroundColor: '#00D4FF',
        borderColor: '#00B4D8',
        borderWidth: 1
      }
    ]
  };

  const teamPerformanceData = {
    labels: analyticsData?.team_performance.labels || [],
    datasets: [
      {
        label: 'Resolved Incidents',
        data: analyticsData?.team_performance.data || [],
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1
      }
    ]
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-gray-400 mt-1">Security incident trends and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 bg-[#2A2D35] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#00D4FF] text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={loadAnalyticsData}
            disabled={refreshing}
            className="p-2 bg-[#2A2D35] border border-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button className="px-4 py-2 bg-[#00D4FF] text-[#1A1D23] rounded-lg text-sm font-medium hover:bg-[#00C4EF] transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-700">
          {[
            { id: 'charts', name: 'Charts & Trends', icon: BarChart3 },
            { id: 'metrics', name: 'Key Metrics', icon: Activity },
            { id: 'reports', name: 'Reports', icon: Download }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === tab.id 
                  ? 'border-[#00D4FF] text-[#00D4FF]' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active view */}
      {activeView === 'charts' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Incidents</p>
                  <p className="text-3xl font-bold text-white">{analyticsData?.monthly_summary.total_incidents}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-sm">+12% from last month</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Activity className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Resolved</p>
                  <p className="text-3xl font-bold text-white">{analyticsData?.monthly_summary.resolved_incidents}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-sm">
                      {((analyticsData?.monthly_summary.resolved_incidents || 0) / (analyticsData?.monthly_summary.total_incidents || 1) * 100).toFixed(1)}% resolution rate
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Shield className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Response Time</p>
                  <p className="text-3xl font-bold text-white">{analyticsData?.monthly_summary.avg_response_time}h</p>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-sm">-0.7h improvement</span>
                  </div>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Clock className="h-8 w-8 text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Critical Incidents</p>
                  <p className="text-3xl font-bold text-white">{analyticsData?.monthly_summary.critical_incidents}</p>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-sm">-3 from last month</span>
                  </div>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Incident Trends */}
            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Incident Trends</h3>
                <TrendingUp className="h-5 w-5 text-[#00D4FF]" />
              </div>
              <div className="h-64">
                <Line data={incidentTrendsData} options={chartOptions} />
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Severity Distribution</h3>
                <PieChart className="h-5 w-5 text-[#00D4FF]" />
              </div>
              <div className="h-64">
                <Doughnut 
                  data={severityDistributionData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#E5E7EB',
                          padding: 20
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Response Times */}
            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Response Times by Severity</h3>
                <Clock className="h-5 w-5 text-[#00D4FF]" />
              </div>
              <div className="h-64">
                <Bar data={responseTimesData} options={chartOptions} />
              </div>
            </div>

            {/* Team Performance */}
            <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Team Performance</h3>
                <BarChart3 className="h-5 w-5 text-[#00D4FF]" />
              </div>
              <div className="h-64">
                <Bar data={teamPerformanceData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Insights Panel */}
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">📊 Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="font-medium text-blue-300 mb-2">Trend Analysis</h4>
                <p className="text-sm text-blue-400">
                  Incident volume increased by 12% this month, primarily driven by phishing attempts.
                </p>
              </div>
              
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h4 className="font-medium text-green-300 mb-2">Performance</h4>
                <p className="text-sm text-green-400">
                  Team response time improved by 0.7 hours compared to last month.
                </p>
              </div>
              
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h4 className="font-medium text-yellow-300 mb-2">Recommendation</h4>
                <p className="text-sm text-yellow-400">
                  Consider additional training on email security awareness.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeView === 'metrics' && (
        <IncidentMetrics timeRange={selectedTimeRange} />
      )}

      {activeView === 'reports' && (
        <SecurityReports />
      )}
    </div>
  );
}