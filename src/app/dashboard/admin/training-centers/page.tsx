'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button, Input } from '@/components/ui';
import api from '@/lib/api';

interface TrainingCenter {
  _id: string;
  centerName: string;
  description: string;
  location?: {
    city?: string;
    country?: string;
  };
  website?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  logo?: string;
  isVerified: boolean;
  createdAt: string;
  user: {
    _id: string;
    email: string;
    isActive: boolean;
    createdAt: string;
  };
  courseCount: number;
  inquiryCount: number;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
}

export default function TrainingCenterVerification() {
  const [centers, setCenters] = useState<TrainingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({
    isVerified: 'all',
    search: ''
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCenters();
  }, [pagination.page, filters.isVerified]);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '10',
        ...(filters.isVerified !== 'all' && { isVerified: filters.isVerified }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/admin/training-centers?${params}`);
      setCenters(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch training centers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCenters();
  };

  const handleVerificationToggle = async (centerId: string, currentStatus: boolean) => {
    try {
      setActionLoading(centerId);
      await api.put(`/admin/training-centers/${centerId}/verify`, { isVerified: !currentStatus });
      setCenters(centers.map(center =>
        center._id === centerId ? { ...center, isVerified: !currentStatus } : center
      ));
    } catch (error) {
      console.error('Failed to update verification status:', error);
      alert('Failed to update verification status');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLocation = (location?: TrainingCenter['location']) => {
    if (!location) return 'Not specified';
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
                <span className="text-gray-900">Training Centers</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Training Center Verification</h1>
              <p className="text-gray-600 mt-1">Review and verify training centers</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-900">{centers.length}</p>
              <p className="text-sm text-gray-500">Total Centers</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {centers.filter(c => c.isVerified).length}
              </p>
              <p className="text-sm text-gray-500">Verified</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {centers.filter(c => !c.isVerified).length}
              </p>
              <p className="text-sm text-gray-500">Pending</p>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by center name..."
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
                value={filters.isVerified}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, isVerified: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="true">Verified</option>
                <option value="false">Pending</option>
              </select>
            </div>
          </Card>

          {/* Training Centers List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : centers.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No training centers found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {centers.map((center) => (
                  <Card key={center._id} className="hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Center Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {center.logo ? (
                            <img src={center.logo} alt={center.centerName} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {center.centerName}
                              </h3>
                              {center.isVerified ? (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Verified
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                                  Pending Verification
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{center.user.email}</p>
                          </div>
                        </div>

                        {center.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{center.description}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Location</p>
                            <p className="font-medium text-gray-900">{formatLocation(center.location)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Courses</p>
                            <p className="font-medium text-gray-900">{center.courseCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Inquiries</p>
                            <p className="font-medium text-gray-900">{center.inquiryCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Joined</p>
                            <p className="font-medium text-gray-900">{formatDate(center.user.createdAt)}</p>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          {center.website && (
                            <a href={center.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              Website
                            </a>
                          )}
                          {center.contactInfo?.email && (
                            <a href={`mailto:${center.contactInfo.email}`} className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {center.contactInfo.email}
                            </a>
                          )}
                          {center.contactInfo?.phone && (
                            <span className="text-gray-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {center.contactInfo.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleVerificationToggle(center._id, center.isVerified)}
                          disabled={actionLoading === center._id}
                          className={center.isVerified ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}
                        >
                          {actionLoading === center._id ? (
                            <span className="animate-spin">...</span>
                          ) : center.isVerified ? (
                            'Revoke Verification'
                          ) : (
                            'Verify Center'
                          )}
                        </Button>
                        <Link href={`/training-centers/${center._id}`} target="_blank">
                          <Button variant="outline" size="sm" className="w-full">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} training centers
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
