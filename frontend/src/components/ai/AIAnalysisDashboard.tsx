'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Brain, 
  Target, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { RootState } from '@/store';
import toast from 'react-hot-toast';

interface AIAnalysisResult {
  categories: Array<{
    category: string;
    confidence: number;
    reasoning: string;
  }>;
  severity: {
    severity: string;
    confidence: number;
    reasoning: string;
  };
  mitigation_strategies: Array<{
    strategy: string;
    priority: number;
    estimated_time: string;
    resources_required: string[];
  }>;
  confidence_score: number;
}

export default function AIAnalysisDashboard() {
  const { idToken } = useSelector((state: RootState) => state.auth);
  const [analysisInput, setAnalysisInput] = useState({
    title: '',
    description: ''
  });
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const handleAnalyze = async () => {
    if (!analysisInput.title || !analysisInput.description) {
      toast.error('Please provide both title and description');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/analyze-incident`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: analysisInput.title,
          description: analysisInput.description,
          context: {}
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        toast.success('AI analysis completed');
      } else {
        toast.error('AI analysis failed');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('Failed to analyze incident');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'phishing': return '🎣';
      case 'malware': return '🦠';
      case 'data_breach': return '💾';
      case 'unauthorized_access': return '🔓';
      case 'social_engineering': return '🎭';
      case 'physical_security': return '🏢';
      default: return '⚠️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Brain className="h-8 w-8 text-[#00D4FF] mr-3" />
        <div>
          <h2 className="text-2xl font-bold text-white">AI Security Analysis</h2>
          <p className="text-gray-400">Advanced incident categorization and response recommendations</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Analyze Incident</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Incident Title *
            </label>
            <input
              type="text"
              value={analysisInput.title}
              onChange={(e) => setAnalysisInput(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]"
              placeholder="Brief title of the security incident"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Incident Description *
            </label>
            <textarea
              value={analysisInput.description}
              onChange={(e) => setAnalysisInput(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full p-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]"
              placeholder="Detailed description of what happened, when, and any relevant context..."
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center px-6 py-3 bg-[#00D4FF] text-[#1A1D23] rounded-lg font-medium hover:bg-[#00C4EF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1A1D23] mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Analyze with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Overall Confidence */}
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">AI Confidence Score</h3>
              <div className="flex items-center">
                <div className="h-2 w-32 bg-gray-700 rounded-full mr-3">
                  <div 
                    className="h-2 bg-[#00D4FF] rounded-full"
                    style={{ width: `${analysisResult.confidence_score * 100}%` }}
                  ></div>
                </div>
                <span className="text-[#00D4FF] font-semibold">
                  {Math.round(analysisResult.confidence_score * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Category Analysis */}
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center mb-4">
              <Target className="h-5 w-5 text-[#00D4FF] mr-2" />
              <h3 className="text-lg font-semibold text-white">Category Analysis</h3>
            </div>
            
            <div className="space-y-3">
              {analysisResult.categories.map((category, index) => (
                <div key={index} className="p-4 bg-[#1A1D23] rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getCategoryIcon(category.category)}</span>
                      <div>
                        <h4 className="font-medium text-white">
                          {category.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <p className="text-sm text-gray-400">{category.reasoning}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#00D4FF] font-semibold">
                        {Math.round(category.confidence * 100)}%
                      </div>
                      <div className="h-1 w-16 bg-gray-700 rounded-full mt-1">
                        <div 
                          className="h-1 bg-[#00D4FF] rounded-full"
                          style={{ width: `${category.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Assessment */}
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-[#00D4FF] mr-2" />
              <h3 className="text-lg font-semibold text-white">Severity Assessment</h3>
            </div>
            
            <div className="p-4 bg-[#1A1D23] rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(analysisResult.severity.severity)}`}>
                    {analysisResult.severity.severity.toUpperCase()}
                  </div>
                </div>
                <div className="text-[#00D4FF] font-semibold">
                  {Math.round(analysisResult.severity.confidence * 100)}% confidence
                </div>
              </div>
              <p className="text-gray-400 text-sm">{analysisResult.severity.reasoning}</p>
            </div>
          </div>

          {/* Mitigation Strategies */}
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-[#00D4FF] mr-2" />
              <h3 className="text-lg font-semibold text-white">AI-Recommended Actions</h3>
            </div>
            
            <div className="space-y-3">
              {analysisResult.mitigation_strategies.map((strategy, index) => (
                <div key={index} className="p-4 bg-[#1A1D23] rounded-lg border border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-[#00D4FF] text-[#1A1D23] rounded-full text-xs font-bold mr-3">
                          {strategy.priority}
                        </div>
                        <h4 className="font-medium text-white">{strategy.strategy}</h4>
                      </div>
                      <div className="flex items-center text-sm text-gray-400 ml-9">
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="mr-4">{strategy.estimated_time}</span>
                        <span>Resources: {strategy.resources_required.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#2A2D35] p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Incident
              </button>
              <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </button>
              <button className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                <Brain className="h-4 w-4 mr-2" />
                Re-analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}