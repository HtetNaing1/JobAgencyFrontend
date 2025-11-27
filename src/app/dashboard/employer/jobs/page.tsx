'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button, Badge } from '@/components/ui';
import api from '@/lib/api';

interface Job {
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
    period: string;
  };
  status: string;
  applicationCount: number;
  viewCount: number;
  postedDate: string;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  draft: number;
  paused: number;
  closed: number;
}

const statusColors: Record<string, string> = {
  active: 'success',
  draft: 'default',
  paused: 'warning',
  closed: 'danger',
};

export default function EmployerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, draft: 0, paused: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      const response = await api.get(`/jobs/employer/me?status=${statusFilter}`);
      setJobs(response.data.data);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    setActionLoading(jobId);
    try {
      await api.put(`/jobs/${jobId}/status`, { status: newStatus });
      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to close this job posting?')) return;

    setActionLoading(jobId);
    try {
      await api.delete(`/jobs/${jobId}`);
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatSalary = (salary: Job['salary']) => {
    if (!salary || (!salary.min && !salary.max)) return 'Not specified';
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['employer']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <button
                onClick={() => router.push('/dashboard/employer')}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">My Job Postings</h1>
            </div>
            <Link href="/jobs/post">
              <Button>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post New Job
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Jobs</p>
            </Card>
            <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('active')}>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-gray-600">Active</p>
            </Card>
            <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('draft')}>
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              <p className="text-sm text-gray-600">Drafts</p>
            </Card>
            <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('paused')}>
              <p className="text-2xl font-bold text-yellow-600">{stats.paused}</p>
              <p className="text-sm text-gray-600">Paused</p>
            </Card>
            <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('closed')}>
              <p className="text-2xl font-bold text-red-600">{stats.closed}</p>
              <p className="text-sm text-gray-600">Closed</p>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['all', 'active', 'draft', 'paused', 'closed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'All Jobs' : status}
              </button>
            ))}
          </div>

          {/* Jobs List */}
          {jobs.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                {statusFilter === 'all'
                  ? "You haven't posted any jobs yet. Start by creating your first job posting."
                  : `No ${statusFilter} jobs found.`
                }
              </p>
              {statusFilter === 'all' && (
                <Link href="/jobs/post">
                  <Button>Post Your First Job</Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <Card key={job._id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/jobs/${job._id}`}>
                              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                                {job.title}
                              </h3>
                            </Link>
                            <Badge variant={statusColors[job.status] as 'success' | 'default' | 'warning' | 'danger'}>
                              {job.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {job.location?.remote ? 'Remote' : `${job.location?.city || ''}, ${job.location?.country || ''}`}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatSalary(job.salary)}
                            </span>
                            <span className="capitalize">{job.jobType?.replace('-', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{job.viewCount} views</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{job.applicationCount} applications</span>
                        </div>
                        <div className="text-gray-500">
                          Posted {formatDate(job.postedDate || job.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                      <Link href={`/jobs/edit/${job._id}`}>
                        <Button variant="outline" size="sm">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Button>
                      </Link>

                      {job.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(job._id, 'paused')}
                          disabled={actionLoading === job._id}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pause
                        </Button>
                      )}

                      {job.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(job._id, 'active')}
                          disabled={actionLoading === job._id}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Activate
                        </Button>
                      )}

                      {job.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(job._id, 'active')}
                          disabled={actionLoading === job._id}
                        >
                          Publish
                        </Button>
                      )}

                      {job.status !== 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(job._id)}
                          disabled={actionLoading === job._id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
