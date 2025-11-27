'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button, Badge } from '@/components/ui';
import BookmarkButton from '@/components/BookmarkButton';
import api from '@/lib/api';

interface JobBookmark {
  _id: string;
  itemType: 'job';
  job: {
    _id: string;
    title: string;
    description: string;
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
    applicationDeadline: string;
    employerProfile?: {
      companyName: string;
      logo: string;
    };
  };
  createdAt: string;
}

interface CourseBookmark {
  _id: string;
  itemType: 'course';
  course: {
    _id: string;
    title: string;
    description: string;
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
    status: string;
    trainingCenterProfile?: {
      centerName: string;
      logo: string;
    };
  };
  createdAt: string;
}

type Bookmark = JobBookmark | CourseBookmark;

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'jobs' | 'courses'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchBookmarks();
  }, [activeTab, pagination.page]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', '10');

      if (activeTab === 'jobs') {
        params.append('type', 'job');
      } else if (activeTab === 'courses') {
        params.append('type', 'course');
      }

      const response = await api.get(`/bookmarks?${params.toString()}`);
      setBookmarks(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = (bookmarkId: string, itemType: 'job' | 'course', itemId: string) => {
    setBookmarks(prev => prev.filter(b => b._id !== bookmarkId));
  };

  const formatSalary = (salary: JobBookmark['job']['salary']) => {
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

  const formatPrice = (price: CourseBookmark['course']['price']) => {
    if (price.isFree) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
      maximumFractionDigits: 0
    }).format(price.amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isDeadlinePassed = (deadline: string) => {
    return deadline && new Date(deadline) < new Date();
  };

  const jobCount = bookmarks.filter(b => b.itemType === 'job').length;
  const courseCount = bookmarks.filter(b => b.itemType === 'course').length;

  return (
    <ProtectedRoute allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Items</h1>
            <p className="text-gray-600">Your bookmarked jobs and courses</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setActiveTab('all');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All ({pagination.total})
            </button>
            <button
              onClick={() => {
                setActiveTab('jobs');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'jobs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => {
                setActiveTab('courses');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'courses'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Courses
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : bookmarks.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved items yet</h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'jobs'
                  ? 'Start saving jobs you\'re interested in'
                  : activeTab === 'courses'
                  ? 'Start saving courses you\'d like to take'
                  : 'Start saving jobs and courses you\'re interested in'}
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/jobs">
                  <Button>Browse Jobs</Button>
                </Link>
                <Link href="/training">
                  <Button variant="outline">Browse Courses</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookmarks.map(bookmark => {
                if (bookmark.itemType === 'job' && bookmark.job) {
                  const job = bookmark.job;
                  const isExpired = isDeadlinePassed(job.applicationDeadline);

                  return (
                    <Card key={bookmark._id} className={`p-6 ${isExpired || job.status !== 'active' ? 'opacity-75' : ''}`}>
                      <div className="flex gap-4">
                        {/* Company Logo */}
                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {job.employerProfile?.logo ? (
                            <img src={job.employerProfile.logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-gray-400">
                              {job.employerProfile?.companyName?.[0] || 'C'}
                            </span>
                          )}
                        </div>

                        {/* Job Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Link href={`/jobs/${job._id}`} className="group">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                                  {job.title}
                                </h3>
                              </Link>
                              <p className="text-gray-600">
                                {job.employerProfile?.companyName || 'Company'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={job.status === 'active' && !isExpired ? 'primary' : 'default'}>
                                {isExpired ? 'Expired' : job.status === 'active' ? 'Active' : job.status}
                              </Badge>
                              <BookmarkButton
                                itemId={job._id}
                                itemType="job"
                                isBookmarked={true}
                                onToggle={(isBookmarked) => {
                                  if (!isBookmarked) {
                                    handleRemoveBookmark(bookmark._id, 'job', job._id);
                                  }
                                }}
                                size="sm"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {job.location?.remote ? 'Remote' : `${job.location?.city || ''}, ${job.location?.country || ''}`}
                            </span>
                            <Badge variant="default" className="capitalize">
                              {job.jobType?.replace('-', ' ')}
                            </Badge>
                            {formatSalary(job.salary) && (
                              <span className="text-sm text-gray-600">
                                {formatSalary(job.salary)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span>Saved {formatDate(bookmark.createdAt)}</span>
                            {job.applicationDeadline && (
                              <span className={isExpired ? 'text-red-500' : ''}>
                                Deadline: {formatDate(job.applicationDeadline)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {job.status === 'active' && !isExpired && (
                        <div className="mt-4 pt-4 border-t">
                          <Link href={`/jobs/${job._id}`}>
                            <Button size="sm">View & Apply</Button>
                          </Link>
                        </div>
                      )}
                    </Card>
                  );
                }

                if (bookmark.itemType === 'course' && bookmark.course) {
                  const course = bookmark.course;

                  return (
                    <Card key={bookmark._id} className={`p-6 ${course.status !== 'published' ? 'opacity-75' : ''}`}>
                      <div className="flex gap-4">
                        {/* Course Icon */}
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>

                        {/* Course Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Link href={`/training/${course._id}`} className="group">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                                  {course.title}
                                </h3>
                              </Link>
                              <p className="text-gray-600">
                                {course.trainingCenterProfile?.centerName || 'Training Center'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${course.price.isFree ? 'text-green-600' : 'text-gray-900'}`}>
                                {formatPrice(course.price)}
                              </span>
                              <BookmarkButton
                                itemId={course._id}
                                itemType="course"
                                isBookmarked={true}
                                onToggle={(isBookmarked) => {
                                  if (!isBookmarked) {
                                    handleRemoveBookmark(bookmark._id, 'course', course._id);
                                  }
                                }}
                                size="sm"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {course.category}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                              {course.level?.replace('-', ' ')}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                              {course.mode}
                            </span>
                            <span className="text-sm text-gray-600">
                              {course.duration?.value} {course.duration?.unit}
                            </span>
                          </div>

                          <div className="mt-3 text-sm text-gray-500">
                            Saved {formatDate(bookmark.createdAt)}
                          </div>
                        </div>
                      </div>

                      {course.status === 'published' && (
                        <div className="mt-4 pt-4 border-t">
                          <Link href={`/training/${course._id}`}>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">View Course</Button>
                          </Link>
                        </div>
                      )}
                    </Card>
                  );
                }

                return null;
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
