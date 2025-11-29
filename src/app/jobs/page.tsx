'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, Button, Badge, Spinner, NoResultsState, SkeletonList, Select } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import BookmarkButton from '@/components/BookmarkButton';
import api from '@/lib/api';

interface Job {
  _id: string;
  title: string;
  description: string;
  jobType: string;
  employer: string; // User ID for company profile link
  location: {
    city: string;
    state: string;
    country: string;
    remote: boolean;
  };
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  requirements: {
    skills: string[];
    experience: string;
    education: string;
  };
  employerProfile: {
    companyName: string;
    logo: string;
    industry: string;
  };
  postedDate: string;
  applicationDeadline: string;
  matchScore?: number;
  matchingSkills?: string[];
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

const jobTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
];

function JobsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 0, limit: 10 });
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [remote, setRemote] = useState(false);
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [recommended, setRecommended] = useState(searchParams.get('recommended') === 'true');
  const [recommendedMessage, setRecommendedMessage] = useState('');

  // Fetch bookmarked job IDs for job seekers
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (user?.role === 'jobseeker') {
        try {
          const response = await api.get('/bookmarks/ids?type=job');
          setBookmarkedJobIds(response.data.data.jobs || []);
        } catch (error) {
          console.error('Error fetching bookmarks:', error);
        }
      }
    };
    fetchBookmarks();
  }, [user]);

  const fetchJobs = useCallback(async (page = 1) => {
    setLoading(true);
    setRecommendedMessage('');
    try {
      if (recommended && user?.role === 'jobseeker') {
        // Fetch recommended jobs
        const response = await api.get(`/jobs/recommended?page=${page}&limit=10`);
        setJobs(response.data.data);
        setPagination(response.data.pagination);
        if (response.data.message) {
          setRecommendedMessage(response.data.message);
        }
      } else {
        // Fetch regular jobs
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', '10');

        if (search) params.append('search', search);
        if (location) params.append('location', location);
        if (selectedJobTypes.length > 0) params.append('jobType', selectedJobTypes.join(','));
        if (remote) params.append('remote', 'true');
        if (minSalary) params.append('minSalary', minSalary);
        if (maxSalary) params.append('maxSalary', maxSalary);

        if (sortBy === 'salary_high') params.append('sort', 'salary_high');
        else if (sortBy === 'salary_low') params.append('sort', 'salary_low');
        else if (sortBy === 'oldest') params.append('sort', 'oldest');

        const response = await api.get(`/jobs?${params.toString()}`);
        setJobs(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [search, location, selectedJobTypes, remote, minSalary, maxSalary, sortBy, recommended, user?.role]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchJobs(1);
    }, 300);

    return () => clearTimeout(debounce);
  }, [fetchJobs]);

  const handleJobTypeToggle = (type: string) => {
    setSelectedJobTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setLocation('');
    setSelectedJobTypes([]);
    setRemote(false);
    setMinSalary('');
    setMaxSalary('');
    setSortBy('newest');
    setRecommended(false);
  };

  const formatSalary = (salary: Job['salary']) => {
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

  const formatDate = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const hasActiveFilters = search || location || selectedJobTypes.length > 0 || remote || minSalary || maxSalary || recommended;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Dream Job</h1>
          <p className="text-blue-100 text-lg mb-8">Discover opportunities from top employers</p>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Job title, keywords, or company"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 border-white/50 text-gray-900 placeholder:text-gray-500 shadow-lg focus:ring-2 focus:ring-white/50 focus:border-white focus:outline-none"
              />
            </div>
            <div className="relative md:w-64">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or country"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 border-white/50 text-gray-900 placeholder:text-gray-500 shadow-lg focus:ring-2 focus:ring-white/50 focus:border-white focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden px-6 py-4 bg-white/20 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>

          {/* Recommended Jobs Button - Only for Job Seekers */}
          {user?.role === 'jobseeker' && (
            <div className="mt-6">
              <button
                onClick={() => setRecommended(!recommended)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  recommended
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <svg className="w-5 h-5" fill={recommended ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {recommended ? 'Showing Recommended Jobs' : 'Recommended for You'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-72 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Job Type */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Job Type</h3>
                <div className="space-y-2">
                  {jobTypes.map(type => (
                    <label key={type.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedJobTypes.includes(type.value)}
                        onChange={() => handleJobTypeToggle(type.value)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Remote */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remote}
                    onChange={(e) => setRemote(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">Remote Only</span>
                </label>
              </div>

              {/* Salary Range */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Salary Range (Yearly)</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(e.target.value)}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="salary_high">Salary: High to Low</option>
                  <option value="salary_low">Salary: Low to High</option>
                </select>
              </div>
            </Card>
          </div>

          {/* Jobs List */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {loading ? 'Loading...' : recommended ? `${pagination.total} recommended jobs` : `${pagination.total} jobs found`}
              </p>
            </div>

            {/* Recommended Message */}
            {recommendedMessage && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-blue-700">{recommendedMessage}</p>
                  <Link href="/profile" className="ml-auto text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap">
                    Update Profile
                  </Link>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {search && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Search: {search}
                    <button onClick={() => setSearch('')} className="hover:text-blue-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Location: {location}
                    <button onClick={() => setLocation('')} className="hover:text-blue-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {selectedJobTypes.map(type => (
                  <span key={type} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
                    {type.replace('-', ' ')}
                    <button onClick={() => handleJobTypeToggle(type)} className="hover:text-blue-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {remote && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Remote
                    <button onClick={() => setRemote(false)} className="hover:text-blue-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {recommended && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Recommended
                    <button onClick={() => setRecommended(false)} className="hover:text-yellow-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Jobs */}
            {loading ? (
              <SkeletonList count={5} />
            ) : jobs.length === 0 ? (
              <Card className="p-8">
                <NoResultsState
                  onClear={clearFilters}
                  searchTerm={search || undefined}
                />
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <Link key={job._id} href={`/jobs/${job._id}`} className="block">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-200">
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
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                                  {job.title}
                                </h3>
                                {job.matchScore !== undefined && job.matchScore > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    {job.matchScore}% match
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600">
                                {job.employerProfile?.companyName || 'Company'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 whitespace-nowrap">
                                {formatDate(job.postedDate)}
                              </span>
                              <BookmarkButton
                                itemId={job._id}
                                itemType="job"
                                isBookmarked={bookmarkedJobIds.includes(job._id)}
                                onToggle={(isBookmarked) => {
                                  setBookmarkedJobIds(prev =>
                                    isBookmarked
                                      ? [...prev, job._id]
                                      : prev.filter(id => id !== job._id)
                                  );
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

                          {job.requirements?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {job.requirements.skills.slice(0, 4).map(skill => (
                                <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {job.requirements.skills.length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                                  +{job.requirements.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => fetchJobs(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => fetchJobs(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Find Your Dream Job</h1>
            <p className="text-blue-100 text-lg">Discover opportunities from top employers</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8 flex justify-center">
          <Spinner size="lg" label="Loading jobs..." />
        </div>
      </div>
    }>
      <JobsContent />
    </Suspense>
  );
}
