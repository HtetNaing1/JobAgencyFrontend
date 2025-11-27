'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button } from '@/components/ui';
import api from '@/lib/api';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  mode: string;
  status: 'draft' | 'published' | 'archived';
  duration: {
    value: number;
    unit: string;
  };
  price: {
    amount: number;
    currency: string;
    isFree: boolean;
  };
  enrolledCount: number;
  viewCount: number;
  createdAt: string;
}

export default function ManageCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/me/courses');
      setCourses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      setDeleteLoading(courseId);
      await api.delete(`/courses/${courseId}`);
      setCourses(courses.filter(c => c._id !== courseId));
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleStatusChange = async (courseId: string, newStatus: string) => {
    try {
      await api.put(`/courses/${courseId}`, { status: newStatus });
      setCourses(courses.map(c =>
        c._id === courseId ? { ...c, status: newStatus as Course['status'] } : c
      ));
    } catch (error) {
      console.error('Failed to update course status:', error);
      alert('Failed to update course status. Please try again.');
    }
  };

  const filteredCourses = filter === 'all'
    ? courses
    : courses.filter(c => c.status === filter);

  const formatPrice = (price: Course['price']) => {
    if (price.isFree) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
      maximumFractionDigits: 0
    }).format(price.amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
    archived: courses.filter(c => c.status === 'archived').length
  };

  return (
    <ProtectedRoute allowedRoles={['training_center']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
              <p className="text-gray-600 mt-1">Manage and track your training courses</p>
            </div>
            <Link href="/dashboard/training-center/courses/new">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Course
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Courses</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              <p className="text-sm text-gray-500">Published</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              <p className="text-sm text-gray-500">Drafts</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              <p className="text-sm text-gray-500">Archived</p>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {(['all', 'published', 'draft', 'archived'] as const).map((status) => (
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

          {/* Courses List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No courses yet' : `No ${filter} courses`}
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all'
                  ? 'Create your first course to get started'
                  : `You don't have any ${filter} courses`}
              </p>
              {filter === 'all' && (
                <Link href="/dashboard/training-center/courses/new">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Create Course
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <Card key={course._id} className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Course Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(course.status)}`}>
                          {course.status}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {course.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {course.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {course.duration.value} {course.duration.unit}
                        </span>
                        <span className="capitalize">{course.level.replace('-', ' ')}</span>
                        <span className="capitalize">{course.mode}</span>
                        <span className={course.price.isFree ? 'text-green-600 font-medium' : ''}>
                          {formatPrice(course.price)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 lg:gap-8">
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">{course.viewCount}</p>
                        <p className="text-xs text-gray-500">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">{course.enrolledCount}</p>
                        <p className="text-xs text-gray-500">Enrolled</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:flex-col lg:gap-2">
                      <Link href={`/training/${course._id}`} className="flex-1 lg:flex-none">
                        <Button variant="outline" size="sm" className="w-full">
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/training-center/courses/${course._id}/edit`} className="flex-1 lg:flex-none">
                        <Button variant="outline" size="sm" className="w-full">
                          Edit
                        </Button>
                      </Link>
                      <div className="relative flex-1 lg:flex-none group">
                        <Button variant="outline" size="sm" className="w-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 hidden group-hover:block">
                          {course.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(course._id, 'published')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Publish
                            </button>
                          )}
                          {course.status === 'published' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(course._id, 'draft')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Unpublish
                              </button>
                              <button
                                onClick={() => handleStatusChange(course._id, 'archived')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Archive
                              </button>
                            </>
                          )}
                          {course.status === 'archived' && (
                            <button
                              onClick={() => handleStatusChange(course._id, 'draft')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Restore to Draft
                            </button>
                          )}
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => handleDelete(course._id)}
                            disabled={deleteLoading === course._id}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            {deleteLoading === course._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
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
