'use client';

import React, { useState, useCallback } from 'react';
import { Upload, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { IKUpload } from 'imagekitio-react';

interface IncidentFormData {
  title: string;
  description: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  location: string;
  attachments: File[];
  timestamp: string;
}

interface AISuggestion {
  category: string;
  confidence: number;
  reason: string;
}

export default function IncidentReportForm() {
  const [formData, setFormData] = useState<IncidentFormData>({
    title: '',
    description: '',
    category: '',
    severity: 'Low',
    location: '',
    attachments: [],
    timestamp: new Date().toISOString(),
  });

  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // AI-powered suggestions based on description
  const handleDescriptionChange = useCallback((description: string) => {
    setFormData(prev => ({ ...prev, description }));
    
    // Simulate AI categorization suggestions
    if (description.length > 20) {
      const suggestions: AISuggestion[] = [];
      
      if (description.toLowerCase().includes('phishing') || description.toLowerCase().includes('email')) {
        suggestions.push({ category: 'Phishing Attack', confidence: 0.92, reason: 'Keywords: phishing, email' });
      }
      if (description.toLowerCase().includes('malware') || description.toLowerCase().includes('virus')) {
        suggestions.push({ category: 'Malware Detection', confidence: 0.88, reason: 'Keywords: malware, virus' });
      }
      if (description.toLowerCase().includes('unauthorized') || description.toLowerCase().includes('access')) {
        suggestions.push({ category: 'Unauthorized Access', confidence: 0.85, reason: 'Keywords: unauthorized, access' });
      }
      
      setAISuggestions(suggestions);
    } else {
      setAISuggestions([]);
    }
  }, []);

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
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    // Reset form or redirect
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle className="h-6 w-6 text-cyan-400" />
          <h2 className="text-xl font-semibold">Report Security Incident</h2>
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
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
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
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
              placeholder="Provide detailed information about the security incident..."
              required
            />
            
            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="mt-3 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <p className="text-sm text-cyan-200 mb-2">🤖 AI Suggestions:</p>
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: suggestion.category }))}
                    className="block w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded mb-2 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{suggestion.category}</span>
                      <span className="text-xs text-cyan-300">{Math.round(suggestion.confidence * 100)}% confidence</span>
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
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
              >
                <option value="">Select category</option>
                <option value="Phishing Attack">Phishing Attack</option>
                <option value="Malware Detection">Malware Detection</option>
                <option value="Unauthorized Access">Unauthorized Access</option>
                <option value="Data Breach">Data Breach</option>
                <option value="Social Engineering">Social Engineering</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Severity Level</label>
              <div className="flex space-x-2">
                {(['Low', 'Medium', 'High', 'Critical'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, severity: level }))}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      formData.severity === level
                        ? 'border-cyan-400 bg-cyan-600/20'
                        : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${getSeverityColor(level)}`}></div>
                      <span className="text-sm">{level}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-colors"
              placeholder="Building, floor, or department"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Evidence Attachments (Max 10MB per file)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-300">Drag and drop files here, or click to select</p>
              <p className="text-sm text-gray-500 mt-2">Supports images, documents, and logs</p>
              <input
                type="file"
                multiple
                className="hidden"
                accept="image/*,.pdf,.txt,.log,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files);
                    setFormData(prev => ({
                      ...prev,
                      attachments: [...prev.attachments, ...files]
                    }));
                  }
                }}
              />
            </div>
            
            {/* Show uploaded files */}
            {formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <span className="text-sm">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        attachments: prev.attachments.filter((_, i) => i !== index)
                      }))}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
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
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Save Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}