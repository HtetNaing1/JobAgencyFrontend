'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';
import api from '@/lib/api';

interface EmployerProfile {
  _id: string;
  companyName: string;
  industry: string;
  description: string;
  logo?: { url: string };
  location?: { city: string; country: string };
  website?: string;
}

interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  pendingReview: number;
  interviewsScheduled: number;
}

interface Job {
  _id: string;
  title: string;
  status: string;
  applicationsCount?: number;
  createdAt: string;
  location?: {
    city?: string;
    country?: string;
    type?: string;
  };
}

interface Application {
  _id: string;
  status: string;
  createdAt: string;
  jobseeker: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  job: {
    _id: string;
    title: string;
  };
}

// Icon components for stats
const BriefcaseIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function EmployerDashboard() {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalApplications: 0,
    pendingReview: 0,
    interviewsScheduled: 0
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/employers/profile');
      setProfile(response.data.data);
    } catch (error) {
      // Profile doesn't exist
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch jobs
      const jobsResponse = await api.get('/jobs/employer/me');
      const jobs = jobsResponse.data.data || [];
      const activeJobsList = jobs.filter((j: Job) => j.status === 'active');

      // Get latest 5 active jobs sorted by creation date
      const sortedActiveJobs = activeJobsList
        .sort((a: Job, b: Job) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentJobs(sortedActiveJobs);

      // Fetch applications
      const appsResponse = await api.get('/applications/employer');
      const applications = appsResponse.data.data || [];
      const statusCounts = appsResponse.data.statusCounts || {};

      // Get latest 5 applications sorted by creation date
      const sortedApplications = [...applications]
        .sort((a: Application, b: Application) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentApplications(sortedApplications);

      setStats({
        activeJobs: activeJobsList.length,
        totalApplications: Object.values(statusCounts).reduce((sum: number, count) => sum + (count as number || 0), 0),
        pendingReview: statusCounts.pending || 0,
        interviewsScheduled: statusCounts.interview || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const isProfileComplete = profile && profile.companyName && profile.industry && profile.description;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'offered': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProfileCompletionPercentage = () => {
    if (!profile) return 0;
    let completed = 0;
    if (profile.companyName) completed += 20;
    if (profile.industry) completed += 20;
    if (profile.description) completed += 20;
    if (profile.logo?.url) completed += 20;
    if (profile.location?.city) completed += 10;
    if (profile.website) completed += 10;
    return completed;
  };

  const statCards = [
    { name: 'Active Jobs', value: stats.activeJobs.toString(), icon: <BriefcaseIcon />, color: 'blue' },
    { name: 'Total Applications', value: stats.totalApplications.toString(), icon: <ClipboardIcon />, color: 'purple' },
    { name: 'Pending Review', value: stats.pendingReview.toString(), icon: <ClockIcon />, color: 'yellow' },
    { name: 'Interviews Scheduled', value: stats.interviewsScheduled.toString(), icon: <CalendarIcon />, color: 'green' },
  ];

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['employer']}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        {/* Profile Completion Banner */}
        {!isProfileComplete && (
          <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Complete Your Company Profile</h3>
                  <p className="text-amber-100">
                    {!profile
                      ? 'Set up your company profile to start posting jobs and attract top talent.'
                      : `Your profile is ${getProfileCompletionPercentage()}% complete. Complete your profile to increase visibility.`}
                  </p>
                </div>
              </div>
              <Link href="/profile">
                <Button className="bg-white text-orange-600 hover:bg-orange-50">
                  {profile ? 'Complete Profile' : 'Set Up Profile'}
                </Button>
              </Link>
            </div>
            {/* Progress Bar */}
            {profile && (
              <div className="mt-4">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${getProfileCompletionPercentage()}%` }}
                  />
                </div>
                <p className="text-xs text-amber-100 mt-2">
                  {getProfileCompletionPercentage()}% complete - Add {!profile.logo?.url ? 'logo, ' : ''}{!profile.location?.city ? 'location, ' : ''}{!profile.website ? 'website' : ''} to complete
                </p>
              </div>
            )}
          </div>
        )}

        {/* Welcome Banner */}
        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile?.logo?.url ? (
                <img src={profile.logo.url} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {profile?.companyName?.[0] || 'C'}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold mb-1 text-white">
                  {profile?.companyName ? `Welcome, ${profile.companyName}!` : 'Welcome!'}
                </h2>
                <p className="text-emerald-100">Ready to find your next great hire? Let&apos;s get started.</p>
              </div>
            </div>
            {isProfileComplete && (
              <Link
                href="/jobs/post"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post a Job
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
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
                {
                  name: 'Post New Job',
                  desc: isProfileComplete ? 'Create a new job listing' : 'Complete profile first',
                  href: isProfileComplete ? '/jobs/post' : '/profile',
                  icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>,
                  disabled: !isProfileComplete
                },
                {
                  name: 'View Applications',
                  desc: 'Review candidate applications',
                  href: '/dashboard/employer/applications',
                  icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                },
                {
                  name: 'Company Profile',
                  desc: isProfileComplete ? 'Update your company info' : 'Set up your profile',
                  href: '/profile',
                  icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
                  highlight: !isProfileComplete
                },
              ].map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
                    action.highlight
                      ? 'border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100'
                      : action.disabled
                      ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    action.highlight ? 'bg-amber-200 text-amber-700' : 'bg-emerald-50 text-emerald-600'
                  }`}>{action.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium transition-colors ${
                      action.highlight ? 'text-amber-800' : 'text-gray-900 group-hover:text-emerald-700'
                    }`}>{action.name}</p>
                    <p className="text-sm text-gray-500">{action.desc}</p>
                  </div>
                  <svg className={`w-5 h-5 transition-colors ${
                    action.highlight ? 'text-amber-500' : 'text-gray-400 group-hover:text-emerald-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </Card>

          {/* Recent Applications */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
              <Link href="/dashboard/employer/applications" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                View all
              </Link>
            </div>

            {stats.totalApplications === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h4>
                <p className="text-gray-500 mb-4">
                  {isProfileComplete ? 'Post a job to start receiving applications' : 'Complete your profile first'}
                </p>
                <Link
                  href={isProfileComplete ? '/jobs/post' : '/profile'}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  {isProfileComplete ? 'Post a Job' : 'Complete Profile'}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((application) => {
                  const firstName = application.jobseeker?.firstName || 'Unknown';
                  const lastName = application.jobseeker?.lastName || '';
                  const jobTitle = application.job?.title || 'Unknown Position';

                  return (
                    <Link
                      key={application._id}
                      href={`/dashboard/employer/applications`}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                        {firstName[0]}{lastName[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                          {firstName} {lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          Applied for: {jobTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(application.createdAt)}</span>
                      </div>
                    </Link>
                  );
                })}
                {stats.totalApplications > 5 && (
                  <div className="text-center pt-2">
                    <Link href="/dashboard/employer/applications" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      View all {stats.totalApplications} applications
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Active Jobs */}
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Active Jobs</h3>
            <Link href="/dashboard/employer/jobs" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Manage jobs
            </Link>
          </div>

          {stats.activeJobs === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No active jobs</h4>
              <p className="text-gray-500 mb-4">
                {isProfileComplete ? 'Create your first job posting to start hiring' : 'Complete your company profile first'}
              </p>
              <Link
                href={isProfileComplete ? '/jobs/post' : '/profile'}
                className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700"
              >
                {isProfileComplete ? 'Post a Job' : 'Complete Profile'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentJobs.map((job) => (
                <Link
                  key={job._id}
                  href={`/jobs/${job._id}`}
                  className="p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {job.title}
                    </h4>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium capitalize">
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">
                      {job.location?.type === 'remote'
                        ? 'Remote'
                        : job.location?.city
                          ? `${job.location.city}${job.location.country ? `, ${job.location.country}` : ''}`
                          : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Posted {formatDate(job.createdAt)}</span>
                    {job.applicationsCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.applicationsCount} applicant{job.applicationsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {stats.activeJobs > 5 && (
                <div className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 transition-colors">
                  <Link href="/dashboard/employer/jobs" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                    View all {stats.activeJobs} jobs
                  </Link>
                </div>
              )}
            </div>
          )}
        </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
