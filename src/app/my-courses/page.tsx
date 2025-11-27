'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button } from '@/components/ui';
import api from '@/lib/api';

interface CourseInquiry {
  _id: string;
  course: {
    _id: string;
    title: string;
    category: string;
    level: string;
    mode: string;
    duration: {
      value: number;
      unit: string;
    };
    price: {
      amount: number;
      currency: string;
      isFree: boolean;
    };
    certification: {
      offered: boolean;
    };
    trainingCenterProfile?: {
      _id: string;
      centerName: string;
      location?: {
        city?: string;
        country?: string;
      };
      isVerified: boolean;
    };
  };
  status: 'pending' | 'contacted' | 'enrolled' | 'closed';
  message: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyCoursesPage() {
  const [inquiries, setInquiries] = useState<CourseInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted' | 'enrolled' | 'closed'>('all');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/user/inquiries');
      setInquiries(response.data.data);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInquiries = filter === 'all'
    ? inquiries
    : inquiries.filter(inq => inq.status === filter);

  const enrolledCourses = inquiries.filter(inq => inq.status === 'enrolled');
  const pendingInquiries = inquiries.filter(inq => inq.status === 'pending' || inq.status === 'contacted');

  const stats = {
    total: inquiries.length,
    enrolled: enrolledCourses.length,
    pending: inquiries.filter(i => i.status === 'pending').length,
    contacted: inquiries.filter(i => i.status === 'contacted').length,
    closed: inquiries.filter(i => i.status === 'closed').length
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' };
      case 'contacted':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Contacted' };
      case 'enrolled':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Enrolled' };
      case 'closed':
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  const formatPrice = (price: CourseInquiry['course']['price']) => {
    if (price.isFree) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
      maximumFractionDigits: 0
    }).format(price.amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-1">Track your course inquiries and enrollments</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Inquiries</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.enrolled}</p>
              <p className="text-sm text-gray-500">Enrolled</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.contacted}</p>
              <p className="text-sm text-gray-500">Contacted</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
              <p className="text-sm text-gray-500">Closed</p>
            </Card>
          </div>

          {/* Enrolled Courses Section */}
          {enrolledCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Enrolled Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledCourses.map((inquiry) => (
                  inquiry.course ? (
                    <Link key={inquiry._id} href={`/training/${inquiry.course._id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 bg-green-50/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Enrolled
                          </span>
                          {inquiry.course.certification?.offered && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Certificate
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {inquiry.course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {inquiry.course.trainingCenterProfile?.centerName}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="capitalize">{inquiry.course.level}</span>
                          <span>•</span>
                          <span className="capitalize">{inquiry.course.mode}</span>
                          <span>•</span>
                          <span>{inquiry.course.duration.value} {inquiry.course.duration.unit}</span>
                        </div>
                      </Card>
                    </Link>
                  ) : (
                    <Card key={inquiry._id} className="h-full border-2 border-red-200 bg-red-50/30">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Unavailable
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <h3 className="font-semibold text-red-700">Course No Longer Available</h3>
                      </div>
                      <p className="text-sm text-red-600">
                        This training center has been removed from the platform.
                      </p>
                    </Card>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {(['all', 'pending', 'contacted', 'enrolled', 'closed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {status === 'all' ? stats.total : stats[status]}
                </span>
              </button>
            ))}
          </div>

          {/* All Inquiries List */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Inquiries</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No course inquiries yet' : `No ${filter} inquiries`}
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all'
                  ? 'Start exploring courses and make your first inquiry!'
                  : `You don't have any ${filter} inquiries`}
              </p>
              {filter === 'all' && (
                <Link href="/training">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Browse Courses
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredInquiries.map((inquiry) => {
                const statusInfo = getStatusBadge(inquiry.status);
                const isBanned = !inquiry.course;

                return (
                  <Card key={inquiry._id} className={`hover:shadow-md transition-shadow ${isBanned ? 'border-red-200 bg-red-50/30' : ''}`}>
                    {/* Banned Notice */}
                    {isBanned && (
                      <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="font-medium">This training center has been removed from the platform</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">The course is no longer available.</p>
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Course Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isBanned ? 'bg-red-100 text-red-700' : statusInfo.bg + ' ' + statusInfo.text}`}>
                            {isBanned ? 'Unavailable' : statusInfo.label}
                          </span>
                          {inquiry.course && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                              {inquiry.course.category}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            Enquired on {formatDate(inquiry.createdAt)}
                          </span>
                        </div>

                        {inquiry.course ? (
                          <Link href={`/training/${inquiry.course._id}`}>
                            <h3 className="font-semibold text-gray-900 text-lg hover:text-purple-600 transition-colors">
                              {inquiry.course.title}
                            </h3>
                          </Link>
                        ) : (
                          <h3 className="font-semibold text-red-700 text-lg">
                            Course No Longer Available
                          </h3>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span className={isBanned ? 'text-red-600' : ''}>
                            {inquiry.course?.trainingCenterProfile?.centerName || 'Training Center Removed'}
                          </span>
                          {inquiry.course?.trainingCenterProfile?.isVerified && (
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>

                        {inquiry.course && (
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {inquiry.course.duration.value} {inquiry.course.duration.unit}
                            </span>
                            <span className="capitalize">{inquiry.course.level}</span>
                            <span className="capitalize">{inquiry.course.mode}</span>
                            <span className={inquiry.course.price.isFree ? 'text-green-600 font-medium' : ''}>
                              {formatPrice(inquiry.course.price)}
                            </span>
                          </div>
                        )}

                        {/* Status Message */}
                        {!isBanned && inquiry.status === 'pending' && (
                          <p className="mt-3 text-sm text-yellow-700 bg-yellow-50 rounded-lg p-2">
                            Your inquiry is pending. The training center will contact you soon.
                          </p>
                        )}
                        {!isBanned && inquiry.status === 'contacted' && (
                          <p className="mt-3 text-sm text-blue-700 bg-blue-50 rounded-lg p-2">
                            The training center has contacted you. Please check your email or phone.
                          </p>
                        )}
                        {!isBanned && inquiry.status === 'enrolled' && (
                          <p className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg p-2">
                            Congratulations! You are enrolled in this course.
                          </p>
                        )}
                        {!isBanned && inquiry.status === 'closed' && (
                          <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                            This inquiry has been closed.
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {inquiry.course && (
                        <div className="flex lg:flex-col gap-2">
                          <Link href={`/training/${inquiry.course._id}`} className="flex-1 lg:flex-none">
                            <Button variant="outline" size="sm" className="w-full">
                              View Course
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
