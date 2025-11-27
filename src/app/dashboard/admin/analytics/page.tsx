'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button } from '@/components/ui';
import api from '@/lib/api';

interface Analytics {
  userRegistrations: Array<{ _id: { date: string; role: string }; count: number }>;
  jobPostings: Array<{ _id: string; count: number }>;
  applications: Array<{ _id: string; count: number }>;
  topCategories: Array<{ _id: string; count: number }>;
  topLocations: Array<{ _id: string; count: number }>;
  applicationOutcomes: Array<{ _id: string; count: number }>;
  topEmployers: Array<{ companyName: string; count: number }>;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('180');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics?period=${period}`);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeColor = (outcome: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      shortlisted: 'bg-blue-500',
      interview_scheduled: 'bg-purple-500',
      rejected: 'bg-red-500',
      hired: 'bg-green-500'
    };
    return colors[outcome] || 'bg-gray-500';
  };

  const formatOutcome = (outcome: string) => {
    return outcome.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTotalApplications = () => {
    if (!analytics?.applicationOutcomes) return 0;
    return analytics.applicationOutcomes.reduce((sum, o) => sum + o.count, 0);
  };

  const getMaxJobCount = () => {
    if (!analytics?.jobPostings) return 1;
    return Math.max(...analytics.jobPostings.map(j => j.count), 1);
  };

  const getMaxAppCount = () => {
    if (!analytics?.applications) return 1;
    return Math.max(...analytics.applications.map(a => a.count), 1);
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/dashboard/admin" className="hover:text-gray-700">Dashboard</Link>
                <span>/</span>
                <span className="text-gray-900">Analytics</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="text-gray-600 mt-1">Platform performance and insights</p>
            </div>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </select>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Job Postings Chart */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Postings Over Time</h3>
              {analytics?.jobPostings && analytics.jobPostings.length > 0 ? (
                <div>
                  <div className="flex items-end gap-1 h-40 mb-2">
                    {analytics.jobPostings.slice(-14).map((item, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600 cursor-pointer"
                        style={{ height: `${Math.max((item.count / getMaxJobCount()) * 100, 5)}%` }}
                        title={`${item._id}: ${item.count} jobs`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {analytics.jobPostings.slice(-14).map((item, index) => (
                      <div key={index} className="flex-1 text-center">
                        <span className="text-xs text-gray-500 block truncate">
                          {new Date(item._id + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">No data available for this period</p>
              )}
            </Card>

            {/* Applications Chart */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications Over Time</h3>
              {analytics?.applications && analytics.applications.length > 0 ? (
                <div>
                  <div className="flex items-end gap-1 h-40 mb-2">
                    {analytics.applications.slice(-14).map((item, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-600 cursor-pointer"
                        style={{ height: `${Math.max((item.count / getMaxAppCount()) * 100, 5)}%` }}
                        title={`${item._id}: ${item.count} applications`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {analytics.applications.slice(-14).map((item, index) => (
                      <div key={index} className="flex-1 text-center">
                        <span className="text-xs text-gray-500 block truncate">
                          {new Date(item._id + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">No data available for this period</p>
              )}
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Application Outcomes */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Outcomes</h3>
              {analytics?.applicationOutcomes && analytics.applicationOutcomes.length > 0 ? (
                <div className="space-y-3">
                  {analytics.applicationOutcomes.map((outcome) => (
                    <div key={outcome._id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 capitalize">{formatOutcome(outcome._id)}</span>
                        <span className="text-sm font-medium text-gray-900">{outcome.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getOutcomeColor(outcome._id)}`}
                          style={{ width: `${(outcome.count / getTotalApplications()) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">No data available</p>
              )}
            </Card>

            {/* Top Job Skills */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Job Skills</h3>
              {analytics?.topCategories && analytics.topCategories.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topCategories.slice(0, 5).map((category, index) => (
                    <div key={category._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700 truncate max-w-[150px]">{category._id || 'Unknown'}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{category.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">No data available</p>
              )}
            </Card>

            {/* Top Locations */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Locations</h3>
              {analytics?.topLocations && analytics.topLocations.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topLocations.slice(0, 5).map((location, index) => (
                    <div key={location._id || 'unknown'} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{location._id || 'Not specified'}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{location.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">No data available</p>
              )}
            </Card>
          </div>

          {/* Top Employers */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Employers by Job Postings</h3>
            {analytics?.topEmployers && analytics.topEmployers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {analytics.topEmployers.map((employer, index) => (
                  <div key={employer.companyName} className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                      #{index + 1}
                    </div>
                    <p className="font-medium text-gray-900 truncate">{employer.companyName}</p>
                    <p className="text-sm text-gray-500">{employer.count} jobs posted</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No data available</p>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
