'use client';

import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Upload, AlertTriangle, MapPin, Clock, X, FileText, Image, Send } from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { createIncident } from '@/store/incidents/incidentSlice';
import toast from 'react-hot-toast';

interface IncidentFormData {
  title: string;
  description: string;
  incident_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  attachments: File[];
  timestamp: string;
}

interface AISuggestion {
  category: string;
  confidence: number;
  reason: string;
}

interface IncidentReportFormProps {
  onClose?: () => void;
}

export default function IncidentReportForm({ onClose }: IncidentReportFormProps) {
  const { idToken } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const [formData, setFormData] = useState<IncidentFormData>({
    title: '',
    description: '',
    incident_type: '',
    severity: 'low',
    location: '',
    attachments: [],
    timestamp: new Date().toISOString(),
  });

  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // AI-powered suggestions based on description
  const handleDescriptionChange = useCallback(async (description: string) => {
    setFormData(prev => ({ ...prev, description }));
    
    // Call real AI API for categorization suggestions
    if (description.length > 20 && idToken) {
      try {
        const response = await fetch(`${API_URL}/api/ai/categorize?title=${encodeURIComponent(formData.title)}&description=${encodeURIComponent(description)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const suggestions: AISuggestion[] = data.categories?.map((cat: {category: string, confidence: number, reasoning: string}) => ({
            category: cat.category,
            confidence: cat.confidence,
            reason: cat.reasoning
          })) || [];
          
          setAISuggestions(suggestions);
        } else {
          // Fallback to keyword-based suggestions if API fails
          const suggestions: AISuggestion[] = [];
          const text = description.toLowerCase();
          
          if (text.includes('phishing') || text.includes('email') || text.includes('suspicious link')) {
            suggestions.push({ category: 'phishing', confidence: 0.92, reason: 'Keywords: phishing, email' });
          }
          if (text.includes('malware') || text.includes('virus') || text.includes('ransomware')) {
            suggestions.push({ category: 'malware', confidence: 0.88, reason: 'Keywords: malware, virus' });
          }
          if (text.includes('unauthorized') || text.includes('access') || text.includes('hacked')) {
            suggestions.push({ category: 'unauthorized_access', confidence: 0.85, reason: 'Keywords: unauthorized, access' });
          }
          if (text.includes('data breach') || text.includes('leak') || text.includes('exposed')) {
            suggestions.push({ category: 'data_breach', confidence: 0.87, reason: 'Keywords: data breach, leak' });
          }
          
          setAISuggestions(suggestions);
        }
      } catch (error) {
        console.error('AI categorization failed:', error);
        // Fallback to basic keyword matching
        setAISuggestions([]);
      }
    } else {
      setAISuggestions([]);
    }
  }, [formData.title, idToken, API_URL]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...files]
      }));
    }
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) {
      toast.error('Authentication required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create incident payload matching backend IncidentCreate model
      const incidentData = {
        title: formData.title,
        description: formData.description,
        incident_type: formData.incident_type || null,
        severity: formData.severity,
        location: formData.location ? {
          address: formData.location
        } : null,
        additional_context: {
          timestamp: formData.timestamp,
          reporter_client: 'web'
        },
        attachments: [] // File IDs will be populated after upload
      };

      // Submit incident via Redux store
      const result = await dispatch(createIncident(incidentData)).unwrap();
      
      // If we have files, upload them
      if (formData.attachments.length > 0 && result.incident_id) {
        await uploadAttachments(result.incident_id);
      }

      toast.success('Incident reported successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        incident_type: '',
        severity: 'low',
        location: '',
        attachments: [],
        timestamp: new Date().toISOString(),
      });
      setAISuggestions([]);
      
      // Close modal if provided
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Failed to submit incident:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadAttachments = async (incidentId: string) => {
    try {
      for (const file of formData.attachments) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('incident_id', incidentId);

        await fetch(`${API_URL}/api/incidents/${incidentId}/attachments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`
          },
          body: formData
        });
      }
    } catch (error) {
      console.error('Failed to upload attachments:', error);
      toast.error('Incident submitted but some files failed to upload');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#1A1D23] text-white">
      <div className="bg-[#2A2D35] p-8 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#00D4FF]/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-[#00D4FF]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Report Security Incident</h2>
              <p className="text-gray-400 text-sm">Help us protect our organization by reporting security concerns</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Incident Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors"
              placeholder="Brief description of the incident"
              required
            />
          </div>

          {/* Description Field with AI Suggestions */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Detailed Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={4}
              className="w-full p-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors"
              placeholder="Provide detailed information about the security incident..."
              required
            />
            
            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="mt-3 p-4 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg">
                <p className="text-sm text-[#00D4FF] mb-3 flex items-center">
                  🤖 AI-Powered Category Suggestions:
                </p>
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, incident_type: suggestion.category }))}
                    className="block w-full text-left p-3 bg-[#1A1D23] hover:bg-[#374151] rounded-lg mb-2 transition-colors border border-gray-700 hover:border-[#00D4FF]/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">{suggestion.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      <span className="text-xs text-[#00D4FF] bg-[#00D4FF]/20 px-2 py-1 rounded">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{suggestion.reason}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category and Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Incident Type</label>
              <select
                value={formData.incident_type}
                onChange={(e) => setFormData(prev => ({ ...prev, incident_type: e.target.value }))}
                className="w-full p-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors"
              >
                <option value="">Select incident type</option>
                <option value="phishing">Phishing Attack</option>
                <option value="malware">Malware Detection</option>
                <option value="unauthorized_access">Unauthorized Access</option>
                <option value="data_breach">Data Breach</option>
                <option value="social_engineering">Social Engineering</option>
                <option value="physical_security">Physical Security</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Severity Level</label>
              <div className="flex space-x-2">
                {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, severity: level }))}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      formData.severity === level
                        ? 'border-[#00D4FF] bg-[#00D4FF]/20'
                        : 'border-gray-600 bg-[#1A1D23] hover:bg-[#374151]'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${getSeverityColor(level.charAt(0).toUpperCase() + level.slice(1))}`}></div>
                      <span className="text-sm">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Field */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full p-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors"
              placeholder="Building, floor, or department"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Evidence Attachments (Max 10MB per file)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-[#00D4FF] bg-[#00D4FF]/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-white">Drag and drop files here, or click to select</p>
              <p className="text-sm text-gray-400 mt-2">Supports images, documents, and logs (Max 10MB each)</p>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                accept="image/*,.pdf,.txt,.log,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files);
                    // Check file size (10MB limit)
                    const validFiles = files.filter(file => {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
                        return false;
                      }
                      return true;
                    });
                    setFormData(prev => ({
                      ...prev,
                      attachments: [...prev.attachments, ...validFiles]
                    }));
                  }
                }}
              />
            </div>
            
            {/* Show uploaded files */}
            {formData.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-white">Attached Files:</p>
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#1A1D23] rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      {file.type.startsWith('image/') ? (
                        // eslint-disable-next-line jsx-a11y/alt-text
                        <Image className="h-4 w-4 text-blue-400" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm text-white">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        attachments: prev.attachments.filter((_, i) => i !== index)
                      }))}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            Incident timestamp: {new Date(formData.timestamp).toLocaleString()}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-[#374151] hover:bg-[#4B5563] text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.description}
              className="px-6 py-3 bg-[#00D4FF] hover:bg-[#00C4EF] text-[#1A1D23] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1A1D23]"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Incident Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}