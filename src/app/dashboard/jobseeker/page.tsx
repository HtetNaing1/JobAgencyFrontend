'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui';
import Link from 'next/link';
import api from '@/lib/api';

interface Job {
  _id: string;
  title: string;
  location: string | {
    city?: string;
    state?: string;
    country?: string;
    remote?: boolean;
  };
  type: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  employerProfile?: {
    companyName: string;
    companyLogo?: string;
  };
  createdAt: string;
}

interface Recommendation {
  job: Job;
  matchScore: number;
  matchReasons: string[];
}

interface Application {
  _id: string;
  job: Job;
  status: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  shortlisted: number;
  interviews: number;
}

// Icon components for stats
const DocumentIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function JobSeekerDashboard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, shortlisted: 0, interviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recommendations, applications in parallel
      const [recsResponse, appsResponse] = await Promise.all([
        api.get('/recommendations?limit=5').catch(() => ({ data: { data: [] } })),
        api.get('/applications?limit=5').catch(() => ({ data: { data: [], stats: {} } }))
      ]);

      setRecommendations(recsResponse.data.data || []);
      setRecentApplications(appsResponse.data.data || []);

      // Calculate stats from applications
      const apps = appsResponse.data.data || [];
      setStats({
        total: appsResponse.data.pagination?.total || apps.length,
        pending: apps.filter((a: Application) => a.status === 'pending' || a.status === 'reviewed').length,
        shortlisted: apps.filter((a: Application) => a.status === 'shortlisted').length,
        interviews: apps.filter((a: Application) => a.status === 'interview').length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (salary?: { min?: number; max?: number; currency?: string }) => {
    if (!salary || (!salary.min && !salary.max)) return 'Salary not specified';
    const currency = salary.currency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
    if (salary.min && salary.max) {
      return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
    }
    return salary.min ? `From ${formatter.format(salary.min)}` : `Up to ${formatter.format(salary.max!)}`;
  };

  const formatLocation = (location: string | { city?: string; state?: string; country?: string; remote?: boolean } | undefined) => {
    if (!location) return 'Location not specified';
    if (typeof location === 'string') return location;
    const parts = [location.city, location.state, location.country].filter(Boolean);
    if (location.remote) return parts.length > 0 ? `${parts.join(', ')} (Remote)` : 'Remote';
    return parts.join(', ') || 'Location not specified';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'reviewed': return 'bg-blue-100 text-blue-700';
      case 'shortlisted': return 'bg-green-100 text-green-700';
      case 'interview': return 'bg-purple-100 text-purple-700';
      case 'offered': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statsData = [
    { name: 'Total Applications', value: stats.total.toString(), icon: <DocumentIcon />, color: 'blue' },
    { name: 'Pending Review', value: stats.pending.toString(), icon: <ClockIcon />, color: 'yellow' },
    { name: 'Shortlisted', value: stats.shortlisted.toString(), icon: <StarIcon />, color: 'green' },
    { name: 'Interviews', value: stats.interviews.toString(), icon: <CalendarIcon />, color: 'purple' },
  ];

  return (
    <ProtectedRoute allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

          {/* Welcome Banner */}
          <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1 text-white">Welcome back!</h2>
                <p className="text-blue-100">Ready to find your next opportunity? Let&apos;s get started.</p>
              </div>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Browse Jobs
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statsData.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${
                    stat.color === 'blue' ? 'text-blue-500' :
                    stat.color === 'yellow' ? 'text-yellow-500' :
                    stat.color === 'green' ? 'text-green-500' :
                    'text-purple-500'
                  }`}>{stat.icon}</div>
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                  stat.color === 'yellow' ? 'from-yellow-500 to-amber-500' :
                  stat.color === 'green' ? 'from-green-500 to-emerald-500' :
                  'from-purple-500 to-indigo-500'
                } transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {[
                  { name: 'Update Profile', desc: 'Keep your info current', href: '/profile', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                  { name: 'My Applications', desc: 'Track your progress', href: '/applications', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                  { name: 'Notifications', desc: 'Check latest updates', href: '/notifications', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
                ].map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">{action.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{action.name}</p>
                      <p className="text-sm text-gray-500">{action.desc}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Recommended Jobs */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
                <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h4>
                  <p className="text-gray-500 mb-4">Complete your profile to get personalized job recommendations</p>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Complete Profile
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <Link
                      key={rec.job._id}
                      href={`/jobs/${rec.job._id}`}
                      className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {rec.job.employerProfile?.companyName?.charAt(0) || 'J'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {rec.job.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {rec.job.employerProfile?.companyName || 'Company'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {rec.matchScore}% match
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {formatLocation(rec.job.location)}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatSalary(rec.job.salary)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs capitalize">
                              {rec.job.type}
                            </span>
                          </div>
                          {rec.matchReasons.length > 0 && (
                            <p className="mt-2 text-xs text-blue-600">
                              {rec.matchReasons.slice(0, 2).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Recent Applications */}
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
              <Link href="/applications" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h4>
                <p className="text-gray-500 mb-4">Start applying to jobs to track your progress here</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
                >
                  Browse Jobs
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-3 text-sm font-medium text-gray-500">Job</th>
                      <th className="pb-3 text-sm font-medium text-gray-500">Company</th>
                      <th className="pb-3 text-sm font-medium text-gray-500">Applied</th>
                      <th className="pb-3 text-sm font-medium text-gray-500">Status</th>
                      <th className="pb-3 text-sm font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentApplications.map((app) => (
                      <tr key={app._id} className="group">
                        <td className="py-4">
                          <p className="font-medium text-gray-900">{app.job?.title || 'Job'}</p>
                          <p className="text-sm text-gray-500">{formatLocation(app.job?.location)}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-gray-600">{app.job?.employerProfile?.companyName || 'Company'}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-gray-600">{formatDate(app.createdAt)}</p>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            href={`/applications/${app._id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
