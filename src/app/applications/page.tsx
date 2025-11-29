'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import { ConfirmModal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Application {
  _id: string;
  job: {
    _id: string;
    title: string;
    jobType: string;
    location: {
      city: string;
      country: string;
      remote: boolean;
    };
    salary: {
      min: number;
      max: number;
      currency: string;
    };
    status: string;
    employer: {
      employerProfile: {
        companyName: string;
        logo: string;
        industry: string;
      };
    };
  };
  status: string;
  appliedDate: string;
  coverLetter: {
    text?: string;
    fileUrl?: string;
    fileName?: string;
  };
  feedback?: {
    message: string;
    category: string;
    providedAt: string;
  };
  interview?: {
    scheduledDate: string;
    location: string;
    meetingLink: string;
    notes: string;
    status: string;
  };
}

interface StatusCounts {
  pending?: number;
  reviewed?: number;
  shortlisted?: number;
  interview?: number;
  rejected?: number;
  hired?: number;
  withdrawn?: number;
}

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [withdrawConfirmId, setWithdrawConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [activeStatus]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== 'all') {
        params.append('status', activeStatus);
      }
      const response = await api.get(`/applications?${params.toString()}`);
      setApplications(response.data.data);
      setStatusCounts(response.data.statusCounts);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    setWithdrawing(applicationId);
    try {
      await api.put(`/applications/${applicationId}/withdraw`);
      setApplications(prev =>
        prev.map(app =>
          app._id === applicationId
            ? { ...app, status: 'withdrawn' }
            : app
        )
      );
      setStatusCounts(prev => ({
        ...prev,
        withdrawn: (prev.withdrawn || 0) + 1,
        [applications.find(a => a._id === applicationId)?.status as keyof StatusCounts]:
          Math.max(0, (prev[applications.find(a => a._id === applicationId)?.status as keyof StatusCounts] || 0) - 1)
      }));
    } catch (error) {
      console.error('Error withdrawing application:', error);
    } finally {
      setWithdrawing(null);
      setWithdrawConfirmId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      reviewed: 'bg-blue-100 text-blue-700',
      shortlisted: 'bg-green-100 text-green-700',
      interview: 'bg-purple-100 text-purple-700',
      rejected: 'bg-red-100 text-red-700',
      hired: 'bg-emerald-100 text-emerald-700',
      withdrawn: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatSalary = (salary: Application['job']['salary']) => {
    if (!salary || (!salary.min && !salary.max)) return null;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency || 'USD',
      maximumFractionDigits: 0,
    });
    if (salary.min && salary.max) {
      return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
    }
    return salary.min ? `From ${formatter.format(salary.min)}` : `Up to ${formatter.format(salary.max)}`;
  };

  const getTotalCount = () => {
    return Object.values(statusCounts).reduce((sum, count) => sum + (count || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">Track and manage your job applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="text-2xl font-bold text-gray-900">{getTotalCount()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Shortlisted</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.shortlisted || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Interviews</p>
            <p className="text-2xl font-bold text-purple-600">{statusCounts.interview || 0}</p>
          </Card>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveStatus(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeStatus === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.value !== 'all' && statusCounts[tab.value as keyof StatusCounts]
                ? ` (${statusCounts[tab.value as keyof StatusCounts]})`
                : tab.value === 'all' ? ` (${getTotalCount()})` : ''}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-6">
              {activeStatus === 'all'
                ? "Start exploring jobs and submit your first application!"
                : `No ${activeStatus} applications found.`}
            </p>
            <Link href="/jobs">
              <Button>Browse Jobs</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map(application => {
              const isJobDeleted = !application.job || !application.job._id;
              return (
              <Card key={application._id} className={`p-6 hover:shadow-md transition-shadow ${isJobDeleted ? 'border-red-200 bg-red-50/30' : ''}`}>
                {/* Banned Employer Notice */}
                {isJobDeleted && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-medium">This employer has been removed from the platform</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">The job posting is no longer available.</p>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${!application.job ? 'bg-red-100' : 'bg-gray-100'}`}>
                    {application.job?.employer?.employerProfile?.logo ? (
                      <img
                        src={application.job.employer.employerProfile.logo}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : !application.job ? (
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <span className="text-xl font-bold text-gray-400">
                        {application.job?.employer?.employerProfile?.companyName?.[0] || 'C'}
                      </span>
                    )}
                  </div>

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {application.job ? (
                          <Link href={`/jobs/${application.job._id}`} className="hover:text-blue-600">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {application.job.title}
                            </h3>
                          </Link>
                        ) : (
                          <h3 className="text-lg font-semibold text-red-700">
                            Job No Longer Available
                          </h3>
                        )}
                        <p className={!application.job ? 'text-red-600' : 'text-gray-600'}>
                          {application.job?.employer?.employerProfile?.companyName || 'Employer Removed'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Applied {formatDate(application.appliedDate)}
                      </span>
                      {application.job?.location && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {application.job.location.remote ? 'Remote' : `${application.job.location.city}, ${application.job.location.country}`}
                        </span>
                      )}
                      {formatSalary(application.job?.salary) && (
                        <span>{formatSalary(application.job.salary)}</span>
                      )}
                    </div>

                    {/* Interview Info */}
                    {application.interview && application.interview.status === 'scheduled' && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2 text-purple-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Interview Scheduled</span>
                        </div>
                        <p className="text-sm text-purple-600 mt-1">
                          {new Date(application.interview.scheduledDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                        {application.interview.location && (
                          <p className="text-sm text-purple-600">{application.interview.location}</p>
                        )}
                        {application.interview.meetingLink && (
                          <a
                            href={application.interview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-purple-700 hover:underline mt-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Join Meeting
                          </a>
                        )}
                      </div>
                    )}

                    {/* Feedback */}
                    {application.feedback?.message && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <span className="font-medium">Employer Feedback</span>
                        </div>
                        <p className="text-sm text-blue-600">{application.feedback.message}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-4">
                      {application.job && (
                        <Link href={`/jobs/${application.job._id}`}>
                          <Button variant="outline" size="sm">View Job</Button>
                        </Link>
                      )}
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Details
                      </button>
                      {application.job && !['rejected', 'hired', 'withdrawn'].includes(application.status) && (
                        <button
                          onClick={() => setWithdrawConfirmId(application._id)}
                          disabled={withdrawing === application._id}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        >
                          {withdrawing === application._id ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
            })}
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Application Details</h3>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Banned Notice in Modal */}
            {!selectedApplication.job && (
              <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium">Employer Removed from Platform</span>
                </div>
                <p className="text-sm text-red-600 mt-1">This employer has been banned and their job postings are no longer available.</p>
              </div>
            )}

            {/* Job Info */}
            <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${!selectedApplication.job ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden ${!selectedApplication.job ? 'bg-red-100' : 'bg-gray-200'}`}>
                {selectedApplication.job?.employer?.employerProfile?.logo ? (
                  <img
                    src={selectedApplication.job.employer.employerProfile.logo}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : !selectedApplication.job ? (
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                ) : (
                  <span className="font-bold text-gray-400">
                    {selectedApplication.job?.employer?.employerProfile?.companyName?.[0]}
                  </span>
                )}
              </div>
              <div>
                <p className={`font-semibold ${!selectedApplication.job ? 'text-red-700' : 'text-gray-900'}`}>
                  {selectedApplication.job?.title || 'Job No Longer Available'}
                </p>
                <p className={`text-sm ${!selectedApplication.job ? 'text-red-600' : 'text-gray-600'}`}>
                  {selectedApplication.job?.employer?.employerProfile?.companyName || 'Employer Removed'}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedApplication.status)}`}>
                {selectedApplication.status}
              </span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Applied Date</h4>
                <p className="text-gray-900">{formatDate(selectedApplication.appliedDate)}</p>
              </div>
              {selectedApplication.interview?.scheduledDate && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Interview Date</h4>
                  <p className="text-gray-900">
                    {new Date(selectedApplication.interview.scheduledDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            {(selectedApplication.coverLetter?.text || selectedApplication.coverLetter?.fileUrl) && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Your Cover Letter</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  {selectedApplication.coverLetter?.text ? (
                    <p className="text-gray-700 whitespace-pre-line">{selectedApplication.coverLetter.text}</p>
                  ) : selectedApplication.coverLetter?.fileUrl ? (
                    <a
                      href={selectedApplication.coverLetter.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {selectedApplication.coverLetter.fileName || 'Download Cover Letter'}
                    </a>
                  ) : null}
                </div>
              </div>
            )}

            {/* Interview Details */}
            {selectedApplication.interview && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Interview Details</h4>
                <div className="p-4 bg-purple-50 rounded-lg space-y-2">
                  {selectedApplication.interview.location && (
                    <p className="text-purple-700">
                      <span className="font-medium">Location:</span> {selectedApplication.interview.location}
                    </p>
                  )}
                  {selectedApplication.interview.meetingLink && (
                    <p className="text-purple-700">
                      <span className="font-medium">Meeting Link:</span>{' '}
                      <a href={selectedApplication.interview.meetingLink} target="_blank" rel="noopener noreferrer" className="underline">
                        {selectedApplication.interview.meetingLink}
                      </a>
                    </p>
                  )}
                  {selectedApplication.interview.notes && (
                    <p className="text-purple-700">
                      <span className="font-medium">Notes:</span> {selectedApplication.interview.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Feedback */}
            {selectedApplication.feedback?.message && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Employer Feedback</h4>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-700">{selectedApplication.feedback.message}</p>
                  {selectedApplication.feedback.providedAt && (
                    <p className="text-xs text-blue-500 mt-2">
                      Provided on {formatDate(selectedApplication.feedback.providedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedApplication(null)}>
                Close
              </Button>
              {selectedApplication.job && (
                <Link href={`/jobs/${selectedApplication.job._id}`} className="flex-1">
                  <Button className="w-full">View Job Posting</Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      <ConfirmModal
        isOpen={withdrawConfirmId !== null}
        onClose={() => setWithdrawConfirmId(null)}
        onConfirm={() => withdrawConfirmId && handleWithdraw(withdrawConfirmId)}
        title="Withdraw Application"
        message="Are you sure you want to withdraw this application? This action cannot be undone and you may not be able to apply for this position again."
        confirmLabel="Withdraw"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={withdrawing !== null}
      />
    </div>
  );
}
