'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button, Badge, Spinner, Modal, EmptyState, Avatar, Textarea, Select } from '@/components/ui';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

interface Application {
  _id: string;
  job: {
    _id: string;
    title: string;
    status: string;
  };
  jobSeeker: {
    _id: string;
    email: string;
    jobSeekerProfile?: {
      firstName: string;
      lastName: string;
      phone: string;
      skills: string[];
      experience: Array<{
        company: string;
        position: string;
      }>;
      photo?: { url: string };
      location: {
        city: string;
        country: string;
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
  resumeUrl: string;
  profileSnapshot: {
    firstName: string;
    lastName: string;
    skills: string[];
    experience: string;
    education: string;
  };
}

interface Job {
  _id: string;
  title: string;
}

interface StatusCounts {
  pending?: number;
  reviewed?: number;
  shortlisted?: number;
  interview?: number;
  rejected?: number;
  hired?: number;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-100 text-blue-700' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-green-100 text-green-700' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
  { value: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-700' },
];

export default function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeJob, setActiveJob] = useState('all');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [interviewData, setInterviewData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    meetingLink: '',
    notes: ''
  });
  const [feedbackData, setFeedbackData] = useState({ message: '', category: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, [activeStatus, activeJob]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== 'all') params.append('status', activeStatus);
      if (activeJob !== 'all') params.append('jobId', activeJob);

      const response = await api.get(`/applications/employer?${params.toString()}`);
      setApplications(response.data.data);
      setStatusCounts(response.data.statusCounts);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/employer/me');
      setJobs(response.data.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedApplications.length === 0) return;
    setProcessing(true);
    try {
      await api.put('/applications/bulk-status', {
        applicationIds: selectedApplications,
        status: newStatus
      });
      setSelectedApplications([]);
      fetchApplications();
    } catch (error) {
      console.error('Error bulk updating status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplication) return;
    setProcessing(true);
    try {
      const scheduledDate = new Date(`${interviewData.scheduledDate}T${interviewData.scheduledTime}`);
      await api.post(`/applications/${selectedApplication._id}/interview`, {
        scheduledDate: scheduledDate.toISOString(),
        location: interviewData.location,
        meetingLink: interviewData.meetingLink,
        notes: interviewData.notes
      });
      setShowInterviewModal(false);
      setInterviewData({ scheduledDate: '', scheduledTime: '', location: '', meetingLink: '', notes: '' });
      fetchApplications();
    } catch (error) {
      console.error('Error scheduling interview:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleProvideFeedback = async () => {
    if (!selectedApplication) return;
    setProcessing(true);
    try {
      await api.post(`/applications/${selectedApplication._id}/feedback`, feedbackData);
      setShowFeedbackModal(false);
      setFeedbackData({ message: '', category: '' });
      fetchApplications();
    } catch (error) {
      console.error('Error providing feedback:', error);
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map(a => a._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedApplications(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(o => o.value === status);
    return option?.color || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTotalCount = () => {
    return Object.values(statusCounts).reduce((sum, count) => sum + (count || 0), 0);
  };

  const getApplicantName = (app: Application) => {
    const profile = app.jobSeeker?.jobSeekerProfile || app.profileSnapshot;
    return profile ? `${profile.firstName} ${profile.lastName}` : app.jobSeeker?.email || 'Unknown';
  };

  return (
    <ProtectedRoute allowedRoles={['employer']}>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications</h1>
            <p className="text-gray-600">Review and manage job applications</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{getTotalCount()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Pending</p>
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
          <Card className="p-4">
            <p className="text-sm text-gray-500">Hired</p>
            <p className="text-2xl font-bold text-emerald-600">{statusCounts.hired || 0}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Job Filter */}
          <select
            value={activeJob}
            onChange={(e) => setActiveJob(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Jobs</option>
            {jobs.map(job => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({getTotalCount()})
            </button>
            {statusOptions.map(status => (
              <button
                key={status.value}
                onClick={() => setActiveStatus(status.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeStatus === status.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status.label} ({statusCounts[status.value as keyof StatusCounts] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-blue-700 font-medium">{selectedApplications.length} applications selected</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusChange('shortlisted')}
                disabled={processing}
              >
                Shortlist
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusChange('rejected')}
                disabled={processing}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedApplications([])}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" label="Loading applications..." />
          </div>
        ) : applications.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title="No applications found"
              description="Applications will appear here when candidates apply to your jobs."
              action={{
                label: 'Post a Job',
                onClick: () => window.location.href = '/jobs/post',
              }}
            />
          </Card>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {applications.map(application => (
                <Card key={application._id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application._id)}
                      onChange={() => toggleSelect(application._id)}
                      className="w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {application.jobSeeker?.jobSeekerProfile?.photo?.url ? (
                        <img
                          src={application.jobSeeker.jobSeekerProfile.photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium text-gray-400">
                          {getApplicantName(application).charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{getApplicantName(application)}</p>
                      <p className="text-sm text-gray-500 truncate">{application.jobSeeker?.email}</p>
                    </div>
                  </div>

                  <div className="ml-7 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate flex-1">{application.job?.title}</p>
                      <span className="text-xs text-gray-400 ml-2">{formatDate(application.appliedDate)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={application.status}
                        onChange={(e) => handleStatusChange(application._id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(application.status)}`}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </button>
                      {application.resumeUrl && (
                        <a
                          href={application.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Resume
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowInterviewModal(true);
                        }}
                        className="text-purple-600 hover:underline text-sm"
                      >
                        Interview
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowFeedbackModal(true);
                        }}
                        className="text-gray-600 hover:underline text-sm"
                      >
                        Feedback
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <Card className="overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedApplications.length === applications.length && applications.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="p-4 text-left text-sm font-medium text-gray-600">Applicant</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-600">Job</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-600">Applied</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {applications.map(application => (
                      <tr key={application._id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(application._id)}
                            onChange={() => toggleSelect(application._id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                              {application.jobSeeker?.jobSeekerProfile?.photo?.url ? (
                                <img
                                  src={application.jobSeeker.jobSeekerProfile.photo.url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-400">
                                  {getApplicantName(application).charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{getApplicantName(application)}</p>
                              <p className="text-sm text-gray-500">{application.jobSeeker?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-900">{application.job?.title}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-600">{formatDate(application.appliedDate)}</p>
                        </td>
                        <td className="p-4">
                          <select
                            value={application.status}
                            onChange={(e) => handleStatusChange(application._id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer ${getStatusColor(application.status)}`}
                          >
                            {statusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedApplication(application);
                              }}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View
                            </button>
                            {application.resumeUrl && (
                              <a
                                href={application.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Resume
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowInterviewModal(true);
                              }}
                              className="text-purple-600 hover:underline text-sm"
                            >
                              Interview
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowFeedbackModal(true);
                              }}
                              className="text-gray-600 hover:underline text-sm"
                            >
                              Feedback
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Applicant Detail Modal */}
      {selectedApplication && !showInterviewModal && !showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Applicant Details</h3>
              <button onClick={() => setSelectedApplication(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                {selectedApplication.jobSeeker?.jobSeekerProfile?.photo?.url ? (
                  <img
                    src={selectedApplication.jobSeeker.jobSeekerProfile.photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {getApplicantName(selectedApplication).charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{getApplicantName(selectedApplication)}</h4>
                <p className="text-gray-600">{selectedApplication.jobSeeker?.email}</p>
                {selectedApplication.jobSeeker?.jobSeekerProfile?.location && (
                  <p className="text-sm text-gray-500">
                    {selectedApplication.jobSeeker.jobSeekerProfile.location.city},{' '}
                    {selectedApplication.jobSeeker.jobSeekerProfile.location.country}
                  </p>
                )}
              </div>
            </div>

            {/* Skills */}
            {(selectedApplication.jobSeeker?.jobSeekerProfile?.skills || selectedApplication.profileSnapshot?.skills)?.length > 0 && (
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-500 mb-2">Skills</h5>
                <div className="flex flex-wrap gap-2">
                  {(selectedApplication.jobSeeker?.jobSeekerProfile?.skills || selectedApplication.profileSnapshot?.skills || []).map((skill: string) => (
                    <Badge key={skill} variant="primary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {selectedApplication.profileSnapshot?.experience && (
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-500 mb-2">Experience</h5>
                <p className="text-gray-700">{selectedApplication.profileSnapshot.experience}</p>
              </div>
            )}

            {/* Education */}
            {selectedApplication.profileSnapshot?.education && (
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-500 mb-2">Education</h5>
                <p className="text-gray-700">{selectedApplication.profileSnapshot.education}</p>
              </div>
            )}

            {/* Cover Letter */}
            {(selectedApplication.coverLetter?.text || selectedApplication.coverLetter?.fileUrl) && (
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-500 mb-2">Cover Letter</h5>
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

            {/* Applied For */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium text-blue-700 mb-1">Applied For</h5>
              <p className="font-medium text-blue-900">{selectedApplication.job?.title}</p>
              <p className="text-sm text-blue-600">Applied on {formatDate(selectedApplication.appliedDate)}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {selectedApplication.resumeUrl && (
                <a href={selectedApplication.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full">View Resume</Button>
                </a>
              )}
              <Button
                className="flex-1"
                onClick={() => {
                  setShowInterviewModal(true);
                }}
              >
                Schedule Interview
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Schedule Interview</h3>
              <button
                onClick={() => {
                  setShowInterviewModal(false);
                  setInterviewData({ scheduledDate: '', scheduledTime: '', location: '', meetingLink: '', notes: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <p className="font-medium text-gray-900">{getApplicantName(selectedApplication)}</p>
                <p className="text-sm text-gray-600">for {selectedApplication.job?.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={interviewData.scheduledDate}
                    onChange={(e) => setInterviewData({ ...interviewData, scheduledDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={interviewData.scheduledTime}
                    onChange={(e) => setInterviewData({ ...interviewData, scheduledTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
                <input
                  type="text"
                  value={interviewData.location}
                  onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                  placeholder="Office address or room number"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (Optional)</label>
                <input
                  type="url"
                  value={interviewData.meetingLink}
                  onChange={(e) => setInterviewData({ ...interviewData, meetingLink: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                  placeholder="Additional instructions for the candidate..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowInterviewModal(false);
                  setInterviewData({ scheduledDate: '', scheduledTime: '', location: '', meetingLink: '', notes: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleScheduleInterview}
                isLoading={processing}
                disabled={!interviewData.scheduledDate || !interviewData.scheduledTime}
              >
                Schedule
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Provide Feedback Modal */}
      {showFeedbackModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Provide Feedback</h3>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackData({ message: '', category: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <p className="font-medium text-gray-900">{getApplicantName(selectedApplication)}</p>
                <p className="text-sm text-gray-600">for {selectedApplication.job?.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={feedbackData.category}
                  onChange={(e) => setFeedbackData({ ...feedbackData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="General feedback">General feedback</option>
                  <option value="Skills assessment">Skills assessment</option>
                  <option value="Interview feedback">Interview feedback</option>
                  <option value="Rejection reason">Rejection reason</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={feedbackData.message}
                  onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                  placeholder="Provide constructive feedback..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackData({ message: '', category: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleProvideFeedback}
                isLoading={processing}
                disabled={!feedbackData.message}
              >
                Send Feedback
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
