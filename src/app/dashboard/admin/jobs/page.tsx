'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button, Input } from '@/components/ui';
import api from '@/lib/api';

interface Job {
  _id: string;
  title: string;
  company: string;
  status: string;
  jobType: string;
  location: {
    city?: string;
    country?: string;
    remote?: boolean;
  };
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  createdAt: string;
  employer?: {
    companyName: string;
    logo?: string;
  };
  applicationCount: number;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

export default function JobModeration() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [pagination.page, filters.status]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '10',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/admin/jobs?${params}`);
      setJobs(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchJobs();
  };

  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    try {
      setActionLoading(jobId);
      await api.put(`/admin/jobs/${jobId}/status`, { status: newStatus });
      setJobs(jobs.map(job =>
        job._id === jobId ? { ...job, status: newStatus } : job
      ));
    } catch (error) {
      console.error('Failed to update job status:', error);
      alert('Failed to update job status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      await api.delete(`/admin/jobs/${jobId}`);
      setJobs(jobs.filter(job => job._id !== jobId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      draft: 'bg-yellow-100 text-yellow-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary: Job['salary']) => {
    if (!salary || (!salary.min && !salary.max)) return 'Not specified';
    const currency = salary.currency || 'USD';
    if (salary.min && salary.max) {
      return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
    }
    if (salary.min) return `${currency} ${salary.min.toLocaleString()}+`;
    return `Up to ${currency} ${salary.max?.toLocaleString()}`;
  };

  const formatLocation = (location: Job['location']) => {
    if (location.remote) return 'Remote';
    const parts = [location.city, location.country].filter(Boolean);
    return parts.join(', ') || 'Not specified';
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/dashboard/admin" className="hover:text-gray-700">Dashboard</Link>
                <span>/</span>
                <span className="text-gray-900">Jobs</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Job Moderation</h1>
              <p className="text-gray-600 mt-1">Review and moderate job postings</p>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by title or company..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </form>

              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </Card>

          {/* Jobs List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : jobs.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job._id} className="hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Job Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadge(job.status)}`}>
                            {job.status}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize">
                            {job.jobType?.replace('-', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {job.applicationCount} applications
                          </span>
                        </div>

                        <Link href={`/jobs/${job._id}`} target="_blank">
                          <h3 className="font-semibold text-gray-900 text-lg hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          {job.employer?.logo && (
                            <img src={job.employer.logo} alt="" className="w-5 h-5 rounded" />
                          )}
                          <span>{job.employer?.companyName || job.company}</span>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {formatLocation(job.location)}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatSalary(job.salary)}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Posted {formatDate(job.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap lg:flex-col gap-2">
                        {job.status !== 'active' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(job._id, 'active')}
                            disabled={actionLoading === job._id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Activate
                          </Button>
                        )}
                        {job.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(job._id, 'closed')}
                            disabled={actionLoading === job._id}
                          >
                            Close
                          </Button>
                        )}
                        <Link href={`/jobs/${job._id}`} target="_blank">
                          <Button variant="outline" size="sm" className="w-full">
                            View
                          </Button>
                        </Link>
                        {deleteConfirm === job._id ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleDelete(job._id)}
                              disabled={actionLoading === job._id}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm(job._id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} jobs
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
