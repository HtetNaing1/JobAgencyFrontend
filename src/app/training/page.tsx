'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import BookmarkButton from '@/components/BookmarkButton';
import api from '@/lib/api';

interface Course {
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
  skillsTaught: string[];
  certification: {
    offered: boolean;
  };
  trainingCenterProfile?: {
    _id: string;
    centerName: string;
    logo?: string;
    isVerified: boolean;
  };
  viewCount: number;
  rating: {
    average: number;
    count: number;
  };
}

interface Category {
  name: string;
  count: number;
}

const levels = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const modes = [
  { value: '', label: 'All Modes' },
  { value: 'online', label: 'Online' },
  { value: 'in-person', label: 'In-Person' },
  { value: 'hybrid', label: 'Hybrid' }
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' }
];

export default function TrainingMarketplace() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    mode: '',
    level: '',
    isFree: false,
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch bookmarked course IDs for job seekers
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (user?.role === 'jobseeker') {
        try {
          const response = await api.get('/bookmarks/ids?type=course');
          setBookmarkedCourseIds(response.data.data.courses || []);
        } catch (error) {
          console.error('Error fetching bookmarks:', error);
        }
      }
    };
    fetchBookmarks();
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [filters, pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/courses/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.mode) params.append('mode', filters.mode);
      if (filters.level) params.append('level', filters.level);
      if (filters.isFree) params.append('isFree', 'true');
      params.append('sortBy', filters.sortBy);
      params.append('page', pagination.page.toString());
      params.append('limit', '12');

      const response = await api.get(`/courses?${params.toString()}`);
      setCourses(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: Course['price']) => {
    if (price.isFree) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
      maximumFractionDigits: 0
    }).format(price.amount);
  };

  const formatDuration = (duration: Course['duration']) => {
    return `${duration.value} ${duration.unit}`;
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      mode: '',
      level: '',
      isFree: false,
      sortBy: 'newest'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filters.search || filters.category || filters.mode || filters.level || filters.isFree;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Training Courses</h1>
          <p className="text-purple-100 text-lg max-w-2xl">
            Discover professional training courses to advance your career and acquire new skills
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search courses, skills, or topics..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <Card className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Mode</h4>
                <div className="space-y-2">
                  {modes.map(mode => (
                    <label key={mode.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="mode"
                        value={mode.value}
                        checked={filters.mode === mode.value}
                        onChange={(e) => handleFilterChange('mode', e.target.value)}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-600">{mode.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Level</h4>
                <div className="space-y-2">
                  {levels.map(level => (
                    <label key={level.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="level"
                        value={level.value}
                        checked={filters.level === level.value}
                        onChange={(e) => handleFilterChange('level', e.target.value)}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-600">{level.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Free Courses */}
              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.isFree}
                    onChange={(e) => handleFilterChange('isFree', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-600">Free courses only</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort & Results Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <p className="text-gray-600">
                {pagination.total} courses found
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : courses.length === 0 ? (
              <Card className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.map(course => (
                    <Link key={course._id} href={`/training/${course._id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group relative">
                        {/* Bookmark Button */}
                        <div className="absolute top-2 right-2 z-10">
                          <BookmarkButton
                            itemId={course._id}
                            itemType="course"
                            isBookmarked={bookmarkedCourseIds.includes(course._id)}
                            onToggle={(isBookmarked) => {
                              setBookmarkedCourseIds(prev =>
                                isBookmarked
                                  ? [...prev, course._id]
                                  : prev.filter(id => id !== course._id)
                              );
                            }}
                            size="sm"
                          />
                        </div>

                        {/* Thumbnail placeholder */}
                        <div className="h-40 -mx-6 -mt-6 mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-t-xl flex items-center justify-center">
                          <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>

                        {/* Category & Level */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {course.category}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                            {course.level.replace('-', ' ')}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                          {course.title}
                        </h3>

                        {/* Training Center */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {course.trainingCenterProfile?.centerName?.charAt(0) || 'T'}
                          </div>
                          <span className="text-sm text-gray-600 truncate">
                            {course.trainingCenterProfile?.centerName || 'Training Center'}
                          </span>
                          {course.trainingCenterProfile?.isVerified && (
                            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDuration(course.duration)}
                          </span>
                          <span className="capitalize">{course.mode}</span>
                          {course.certification.offered && (
                            <span className="flex items-center gap-1 text-green-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                              Cert
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className={`text-lg font-bold ${course.price.isFree ? 'text-green-600' : 'text-gray-900'}`}>
                            {formatPrice(course.price)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {course.viewCount} views
                          </span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
