'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, User, FileText, Calendar, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { fetchPendingApplications, reviewApplication } from '@/store/applications/applicationSlice';
import { RootState, AppDispatch } from '@/store';
import toast from 'react-hot-toast';

interface SecurityApplication {
  id: string;
  applicant_uid: string;
  reason: string;
  experience: string;
  certifications?: string;
  proof_documents: string[];
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

interface ReviewModalProps {
  application: SecurityApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onReview: (applicationId: string, status: 'approved' | 'rejected', notes: string) => void;
}

function ReviewModal({ application, isOpen, onClose, onReview }: ReviewModalProps) {
  const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !application) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onReview(application.id, status, notes);
      setNotes('');
      setStatus('approved');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2A2D35] rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-[#00D4FF] mr-3" />
            <h2 className="text-xl font-bold text-white">Review Application</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Application Details */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-white font-medium">Applicant ID: {application.applicant_uid}</span>
            </div>
            <div className="flex items-center text-gray-400 text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              Submitted: {formatDate(application.created_at)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Reason */}
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Reason for Joining</h4>
              <div className="bg-[#1A1D23] p-4 rounded-lg border border-gray-600">
                <p className="text-gray-300 text-sm">{application.reason}</p>
              </div>
            </div>

            {/* Experience */}
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Experience</h4>
              <div className="bg-[#1A1D23] p-4 rounded-lg border border-gray-600">
                <p className="text-gray-300 text-sm">{application.experience}</p>
              </div>
            </div>

            {/* Certifications */}
            {application.certifications && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Certifications</h4>
                <div className="bg-[#1A1D23] p-4 rounded-lg border border-gray-600">
                  <p className="text-gray-300 text-sm">{application.certifications}</p>
                </div>
              </div>
            )}

            {/* Documents */}
            {application.proof_documents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Uploaded Documents</h4>
                <div className="bg-[#1A1D23] p-4 rounded-lg border border-gray-600 space-y-2">
                  {application.proof_documents.map((doc: string, index: number) => (
                    <div key={index} className="flex items-center text-gray-300 text-sm">
                      <FileText className="h-3 w-3 text-gray-400 mr-2" />
                      {doc}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-3">Decision</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="approved"
                    checked={status === 'approved'}
                    onChange={(e) => setStatus(e.target.value as 'approved')}
                    className="sr-only"
                  />
                  <div className={`flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    status === 'approved' 
                      ? 'bg-green-500/20 border-green-500 text-green-400' 
                      : 'bg-[#1A1D23] border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="rejected"
                    checked={status === 'rejected'}
                    onChange={(e) => setStatus(e.target.value as 'rejected')}
                    className="sr-only"
                  />
                  <div className={`flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    status === 'rejected' 
                      ? 'bg-red-500/20 border-red-500 text-red-400' 
                      : 'bg-[#1A1D23] border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </div>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-white mb-2">
                Admin Notes (Optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full pl-12 pr-4 py-3 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors resize-none"
                  placeholder="Add any notes for the applicant (optional)..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                  status === 'approved'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {status === 'approved' ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                    {status === 'approved' ? 'Approve Application' : 'Reject Application'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminApplicationReview() {
  const dispatch = useDispatch<AppDispatch>();
  const { pendingApplications, loading, error } = useSelector((state: RootState) => state.applications);
  const [selectedApplication, setSelectedApplication] = useState<SecurityApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPendingApplications());
  }, [dispatch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReviewClick = (application: SecurityApplication) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  const handleReview = async (applicationId: string, reviewStatus: 'approved' | 'rejected', notes: string) => {
    try {
      await dispatch(reviewApplication({
        applicationId,
        reviewData: { status: reviewStatus, admin_notes: notes }
      })).unwrap();
      
      toast.success(`Application ${reviewStatus} successfully`);
      
      // Refresh pending applications
      dispatch(fetchPendingApplications());
    } catch (error) {
      toast.error(error as string);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#2A2D35] p-8 rounded-lg border border-gray-700">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]"></div>
          <span className="ml-3 text-gray-400">Loading pending applications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#2A2D35] p-8 rounded-lg border border-gray-700">
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Applications</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#2A2D35] p-8 rounded-lg border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-[#00D4FF] mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-white">Security Team Applications</h2>
              <p className="text-gray-400">Review and approve applications to join the security team</p>
            </div>
          </div>
          <div className="text-[#00D4FF] font-medium">
            {pendingApplications.length} Pending
          </div>
        </div>

        {/* Applications List */}
        {pendingApplications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Pending Applications</h3>
            <p className="text-gray-400">All security team applications have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApplications.map((application) => (
              <div key={application.id} className="bg-[#1A1D23] p-6 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-white font-medium">Applicant: {application.applicant_uid}</span>
                      <span className="ml-4 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs rounded-full">
                        Pending Review
                      </span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm mb-3">
                      <Calendar className="h-4 w-4 mr-1" />
                      Submitted: {formatDate(application.created_at)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Reason:</p>
                        <p className="text-gray-300 text-sm line-clamp-2">{application.reason}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Experience:</p>
                        <p className="text-gray-300 text-sm line-clamp-2">{application.experience}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6">
                    <button
                      onClick={() => handleReviewClick(application)}
                      className="px-4 py-2 bg-[#00D4FF] text-[#1A1D23] rounded-lg font-medium hover:bg-[#00C4EF] transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        application={selectedApplication}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedApplication(null);
        }}
        onReview={handleReview}
      />
    </>
  );
}