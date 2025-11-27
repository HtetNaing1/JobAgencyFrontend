'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui';
import api from '@/lib/api';

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalJobSeekers: number;
    totalEmployers: number;
    totalTrainingCenters: number;
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalCourses: number;
  };
  applicationStats: Record<string, number>;
  trainingCenters: {
    verified: number;
    unverified: number;
  };
  registrationTrend: Array<{ _id: string; count: number }>;
  recentUsers: Array<{
    _id: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>;
  recentJobs: Array<{
    _id: string;
    title: string;
    status: string;
    createdAt: string;
    employerProfile?: { companyName: string };
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      jobseeker: 'bg-blue-100 text-blue-700',
      employer: 'bg-purple-100 text-purple-700',
      training_center: 'bg-green-100 text-green-700'
    };
    return badges[role] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      draft: 'bg-yellow-100 text-yellow-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">System overview and management</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link href="/dashboard/admin/users">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Users</h3>
                <p className="text-sm text-gray-500">Manage all users</p>
              </Card>
            </Link>

            <Link href="/dashboard/admin/jobs">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Jobs</h3>
                <p className="text-sm text-gray-500">Moderate postings</p>
              </Card>
            </Link>

            <Link href="/dashboard/admin/training-centers">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Training Centers</h3>
                <p className="text-sm text-gray-500">Verify centers</p>
              </Card>
            </Link>

            <Link href="/dashboard/admin/analytics">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-orange-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500">View reports</p>
              </Card>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats?.overview.totalUsers || 0}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats?.overview.totalJobSeekers || 0}</p>
              <p className="text-sm text-gray-500">Job Seekers</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-purple-600">{stats?.overview.totalEmployers || 0}</p>
              <p className="text-sm text-gray-500">Employers</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats?.overview.totalTrainingCenters || 0}</p>
              <p className="text-sm text-gray-500">Training Centers</p>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats?.overview.totalJobs || 0}</p>
              <p className="text-sm text-gray-500">Total Jobs</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats?.overview.activeJobs || 0}</p>
              <p className="text-sm text-gray-500">Active Jobs</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-orange-600">{stats?.overview.totalApplications || 0}</p>
              <p className="text-sm text-gray-500">Applications</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{stats?.overview.totalCourses || 0}</p>
              <p className="text-sm text-gray-500">Courses</p>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                <Link href="/dashboard/admin/users" className="text-sm text-blue-600 hover:text-blue-700">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {stats?.recentUsers?.map((user) => (
                  <div key={user._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{user.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getRoleBadge(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(user.createdAt)}</p>
                      <span className={`text-xs ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent users</p>
                )}
              </div>
            </Card>

            {/* Recent Jobs */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
                <Link href="/dashboard/admin/jobs" className="text-sm text-blue-600 hover:text-blue-700">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {stats?.recentJobs?.map((job) => (
                  <div key={job._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.employerProfile?.companyName || 'Unknown Company'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusBadge(job.status)}`}>
                        {job.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(job.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {(!stats?.recentJobs || stats.recentJobs.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent jobs</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
