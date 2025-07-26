'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, FileText, Upload, User, Award, Send } from 'lucide-react';
import { submitApplication, checkCanApply } from '@/store/applications/applicationSlice';
import { RootState, AppDispatch } from '@/store';
import toast from 'react-hot-toast';

interface SecurityApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SecurityApplicationForm({ onSuccess, onCancel }: SecurityApplicationFormProps) {
  const [formData, setFormData] = useState({
    reason: '',
    experience: '',
    certifications: '',
    proof_documents: [] as string[]
  });
  
  const dispatch = useDispatch<AppDispatch>();
  const { submitting, error } = useSelector((state: RootState) => state.applications);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason.trim() || !formData.experience.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await dispatch(submitApplication(formData)).unwrap();
      toast.success('Application submitted successfully!');
      
      // Refresh eligibility status
      dispatch(checkCanApply());
      
      // Reset form
      setFormData({
        reason: '',
        experience: '',
        certifications: '',
        proof_documents: []
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error as string);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // TODO: Implement ImageKit file upload
    // For now, just simulate file upload
    const fileNames = Array.from(files).map(file => file.name);
    setFormData({
      ...formData,
      proof_documents: [...formData.proof_documents, ...fileNames]
    });
    
    toast.success(`${files.length} file(s) uploaded`);
  };

  const removeDocument = (index: number) => {
    const newDocs = formData.proof_documents.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      proof_documents: newDocs
    });
  };

  return (
    <div className="bg-[#2A2D35] p-8 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Shield className="h-8 w-8 text-[#00D4FF] mr-3" />
        <div>
          <h2 className="text-2xl font-bold text-white">Apply to Security Team</h2>
          <p className="text-gray-400">Submit your application to join the security team</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reason for Joining */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-white mb-2">
            Reason for Joining Security Team *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows={4}
              className="w-full pl-12 pr-4 py-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors resize-none"
              placeholder="Explain why you want to join the security team and how you can contribute..."
            />
          </div>
        </div>

        {/* Experience */}
        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-white mb-2">
            Relevant Experience *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              required
              rows={4}
              className="w-full pl-12 pr-4 py-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors resize-none"
              placeholder="Describe your relevant cybersecurity experience, training, or education..."
            />
          </div>
        </div>

        {/* Certifications */}
        <div>
          <label htmlFor="certifications" className="block text-sm font-medium text-white mb-2">
            Certifications (Optional)
          </label>
          <div className="relative">
            <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="certifications"
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors"
              placeholder="CISSP, CEH, Security+, etc."
            />
          </div>
        </div>

        {/* Document Upload */}
        <div>
          <label htmlFor="documents" className="block text-sm font-medium text-white mb-2">
            Proof Documents
          </label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              id="documents"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="documents"
              className="cursor-pointer text-[#00D4FF] hover:text-[#00C4EF] font-medium"
            >
              Click to upload documents
            </label>
            <p className="text-gray-400 text-sm mt-2">
              Upload certificates, resumes, or other supporting documents
            </p>
            <p className="text-gray-500 text-xs mt-1">
              PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
            </p>
          </div>

          {/* Uploaded Files */}
          {formData.proof_documents.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2">Uploaded Documents:</h4>
              <div className="space-y-2">
                {formData.proof_documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#1A1D23] p-3 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-white text-sm">{doc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-[#00D4FF] text-[#1A1D23] rounded-lg font-medium hover:bg-[#00C4EF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1A1D23] mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}