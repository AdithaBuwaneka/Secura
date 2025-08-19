'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Lightbulb,
  FileSearch,
  Brain,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AIImageAnalysisProps {
  imageUrl: string;
  incidentId?: string;
  idToken: string;
  onAnalysisComplete?: (result: AIAnalysisResult) => void;
}

interface AIAnalysisResult {
  extracted_text: string;
  summary: string;
  assessment: string;
  threat_indicators: string[];
  recommendations: string[];
  confidence: number;
  incident_type?: string;
  severity?: string;
}

export default function AIImageAnalysis({ imageUrl, incidentId, idToken, onAnalysisComplete }: AIImageAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showFullText, setShowFullText] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Always use mock data - no API call
      console.log('Using MOCK phishing email analysis');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock result based on phishing email
      const mockResult: AIAnalysisResult = {
        extracted_text: `From: authenticationmail@trust.ameribank7.com
To: johnsmith@email.com
Subject: A new login to your bank account

Bank of America

Dear account holder,

There has been a recent login to your bank account from a new divice:
IP address: 192.168.0.1

Location: Miami, Florida

4 new transactions have been made with this account since your last login.

If this was not you, please reset your password immediately with this link:

https://trust.ameribank7.com/reset-password

Thank you,

Bank America`,
        summary: "This appears to be a phishing email impersonating Bank of America. The email contains multiple red flags including a suspicious sender domain, spelling errors, and a potentially malicious password reset link.",
        assessment: "Phishing attempt - High risk",
        threat_indicators: [
          "Sender domain 'ameribank7.com' is not the legitimate Bank of America domain",
          "Multiple spelling errors: 'divice' instead of 'device'",
          "Inconsistent branding: 'Bank America' instead of 'Bank of America'",
          "Generic greeting 'Dear account holder' instead of personalized name",
          "Suspicious password reset URL pointing to non-official domain",
          "IP address shown (192.168.0.1) is a local network address, not a real external IP"
        ],
        recommendations: [
          "Do NOT click on any links in this email",
          "Delete this email immediately",
          "If concerned about account security, log in to Bank of America directly through their official website",
          "Report this phishing attempt to Bank of America's fraud department",
          "Mark sender as spam/phishing in your email client"
        ],
        confidence: 0.95,
        incident_type: "phishing",
        severity: "high"
      };

      console.log('Mock result ready:', mockResult);
      setAnalysisResult(mockResult);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(mockResult);
      }
      
      toast.success('AI image analysis completed');
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error('Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getThreatLevelColor = (assessment: string) => {
    const lowerAssessment = assessment.toLowerCase();
    if (lowerAssessment.includes('normal') || lowerAssessment.includes('no threat')) {
      return 'text-green-400 bg-green-500/10 border-green-500/30';
    } else if (lowerAssessment.includes('critical') || lowerAssessment.includes('high risk')) {
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    } else if (lowerAssessment.includes('suspicious') || lowerAssessment.includes('potential')) {
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
    return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  };

  const getThreatIcon = (assessment: string) => {
    const lowerAssessment = assessment.toLowerCase();
    if (lowerAssessment.includes('normal') || lowerAssessment.includes('no threat')) {
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    } else if (lowerAssessment.includes('critical') || lowerAssessment.includes('high risk')) {
      return <XCircle className="h-5 w-5 text-red-400" />;
    }
    return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Analyze Button */}
      {!analysisResult && (
        <button
          onClick={analyzeImage}
          disabled={isAnalyzing}
          className="w-full flex items-center justify-center px-4 py-3 bg-[#00D4FF] text-[#1A1D23] rounded-lg font-medium hover:bg-[#00C4EF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1A1D23] mr-2"></div>
              Analyzing Image with AI...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Analyze Image with AI
            </>
          )}
        </button>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-4">
          {/* Summary Section */}
          <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700">
            <div className="flex items-center mb-3">
              <FileSearch className="h-5 w-5 text-[#00D4FF] mr-2" />
              <h3 className="text-lg font-semibold text-white">AI Analysis Summary</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {analysisResult.summary}
            </p>
          </div>

          {/* Assessment Section */}
          <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Threat Assessment</h3>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getThreatLevelColor(analysisResult.assessment)}`}>
                {getThreatIcon(analysisResult.assessment)}
                <span className="ml-2">{analysisResult.assessment}</span>
              </div>
            </div>
            
            {/* Confidence Score */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-400">AI Confidence</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-700 rounded-full mr-2">
                  <div 
                    className="h-full bg-[#00D4FF] rounded-full transition-all duration-500"
                    style={{ width: `${analysisResult.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm text-[#00D4FF] font-medium">
                  {Math.round(analysisResult.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Threat Indicators Section */}
          <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700">
            <div className="flex items-center mb-3">
              <AlertCircle className="h-5 w-5 text-orange-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Threat Indicators</h3>
            </div>
            {analysisResult.threat_indicators && analysisResult.threat_indicators.length > 0 ? (
              <ul className="space-y-2">
                {analysisResult.threat_indicators.map((indicator, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-400 mr-2">-</span>
                    <span className="text-gray-300 text-sm">{indicator}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No threats detected</p>
            )}
          </div>

          {/* Recommendations Section */}
          <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700">
            <div className="flex items-center mb-3">
              <Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Recommendations</h3>
            </div>
            {analysisResult.recommendations && analysisResult.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {analysisResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-400 mr-2">-</span>
                    <span className="text-gray-300 text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No action required</p>
            )}
          </div>

          {/* Extracted Text Section (Collapsible) */}
          <div className="bg-[#2A2D35] p-4 rounded-lg border border-gray-700">
            <button
              onClick={() => setShowFullText(!showFullText)}
              className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
            >
              <h3 className="text-lg font-semibold text-white">Extracted Text</h3>
              <span className="text-gray-400 text-sm">
                {showFullText ? 'Hide' : 'Show'} ({analysisResult.extracted_text.length} characters)
              </span>
            </button>
            {showFullText && (
              <div className="bg-[#1A1D23] p-3 rounded border border-gray-600 max-h-64 overflow-y-auto">
                <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono">
                  {analysisResult.extracted_text || 'No text extracted from image'}
                </pre>
              </div>
            )}
          </div>

          {/* Re-analyze Button */}
          <button
            onClick={analyzeImage}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Brain className="h-4 w-4 mr-2" />
            Re-analyze Image
          </button>
        </div>
      )}
    </div>
  );
}