'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  certification: {
    offered: boolean;
    name?: string;
    issuedBy?: string;
  };
  skillsTaught: string[];
  prerequisites: string[];
  schedule?: string;
  startDate?: string;
  enrollmentDeadline?: string;
  maxParticipants?: number;
  enrolledCount: number;
  trainingCenterProfile?: {
    _id: string;
    centerName: string;
    description?: string;
    logo?: string;
    isVerified: boolean;
    location?: {
      city?: string;
      country?: string;
    };
    contactInfo?: {
      email?: string;
      phone?: string;
      website?: string;
    };
  };
  viewCount: number;
  createdAt: string;
}

interface Inquiry {
  _id: string;
  status: 'pending' | 'contacted' | 'enrolled' | 'closed';
  createdAt: string;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [existingInquiry, setExistingInquiry] = useState<Inquiry | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  // Track if view has been recorded to prevent double counting in React Strict Mode
  const viewRecorded = useRef(false);

  useEffect(() => {
    if (params.id) {
      fetchCourse();
    }
  }, [params.id]);

  // Separate effect for recording view - only runs once
  useEffect(() => {
    if (!viewRecorded.current && params.id) {
      viewRecorded.current = true;
      api.post(`/courses/${params.id}/view`).catch(() => {});
    }
  }, [params.id]);

  useEffect(() => {
    // Fetch existing inquiry and bookmark status for jobseekers
    if (params.id && isAuthenticated && user?.role === 'jobseeker') {
      fetchExistingInquiry();
      checkBookmarkStatus();
    }
  }, [params.id, isAuthenticated, user?.role]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await api.get(`/bookmarks/check/course/${params.id}`);
      setIsBookmarked(response.data.isBookmarked);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
    }
  };

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${params.id}`);
      setCourse(response.data.data);
    } catch (err) {
      console.error('Error fetching course:', err);
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingInquiry = async () => {
    try {
      const response = await api.get(`/courses/${params.id}/my-inquiry`);
      setExistingInquiry(response.data.data);
    } catch (err) {
      // No inquiry exists, that's fine
      console.log('No existing inquiry');
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryError('');

    try {
      const response = await api.post(`/courses/${params.id}/inquiry`, inquiryForm);
      setInquirySuccess(true);
      setExistingInquiry(response.data.data);
      setInquiryForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => {
        setShowInquiryModal(false);
        setInquirySuccess(false);
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setInquiryError(error.response?.data?.message || 'Failed to submit inquiry');
    } finally {
      setInquiryLoading(false);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEnquireClick = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(`/training/${params.id}`));
      return;
    }
    setShowInquiryModal(true);
  };

  const getInquiryStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Enquiry Pending' };
      case 'contacted':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Training Center Contacted You' };
      case 'enrolled':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Enrolled' };
      case 'closed':
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inquiry Closed' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  // Render the enquiry button based on user role and inquiry status
  const renderEnquiryButton = () => {
    // Not authenticated
    if (!isAuthenticated) {
      return (
        <Button
          onClick={handleEnquireClick}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Login to Enquire
        </Button>
      );
    }

    // Employer, Training Center, or Admin - cannot enquire
    if (user?.role === 'employer' || user?.role === 'training_center' || user?.role === 'admin') {
      return (
        <div className="text-center py-3 px-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">Only job seekers can enquire about courses</p>
        </div>
      );
    }

    // Jobseeker with existing inquiry
    if (existingInquiry) {
      const statusInfo = getInquiryStatusBadge(existingInquiry.status);
      return (
        <div className="space-y-3">
          <div className={`text-center py-3 px-4 ${statusInfo.bg} rounded-lg`}>
            <p className={`text-sm font-medium ${statusInfo.text}`}>{statusInfo.label}</p>
            {existingInquiry.status === 'enrolled' && (
              <p className="text-xs text-green-600 mt-1">Congratulations! You are enrolled in this course.</p>
            )}
          </div>
          <Link href="/my-courses">
            <Button variant="outline" className="w-full">
              View My Courses
            </Button>
          </Link>
        </div>
      );
    }

    // Jobseeker without inquiry - can enquire
    return (
      <Button
        onClick={handleEnquireClick}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        Enquire Now
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center py-12 px-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The course you are looking for does not exist.'}</p>
          <Link href="/training">
            <Button>Browse Courses</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-purple-200 text-sm mb-4">
            <Link href="/training" className="hover:text-white">Training</Link>
            <span>/</span>
            <span className="text-white">{course.category}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                  {course.category}
                </span>
                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm capitalize">
                  {course.level.replace('-', ' ')}
                </span>
                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm capitalize">
                  {course.mode}
                </span>
                {course.certification.offered && (
                  <span className="px-3 py-1 bg-green-500/80 text-white rounded-full text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Certificate
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {course.title}
              </h1>

              {/* Training Center */}
              <div className="flex items-center gap-3 text-purple-100">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                  {course.trainingCenterProfile?.centerName?.charAt(0) || 'T'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {course.trainingCenterProfile?.centerName || 'Training Center'}
                    </span>
                    {course.trainingCenterProfile?.isVerified && (
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {course.trainingCenterProfile?.location && (
                    <span className="text-sm">
                      {[course.trainingCenterProfile.location.city, course.trainingCenterProfile.location.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price Card */}
            <Card className="lg:w-80 flex-shrink-0">
              <div className="text-center pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-3xl font-bold ${course.price.isFree ? 'text-green-600' : 'text-gray-900'}`}>
                    {formatPrice(course.price)}
                  </div>
                  <BookmarkButton
                    itemId={params.id as string}
                    itemType="course"
                    isBookmarked={isBookmarked}
                    onToggle={setIsBookmarked}
                    size="md"
                  />
                </div>
              </div>

              <div className="py-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">Duration: {course.duration.value} {course.duration.unit}</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-600 capitalize">{course.mode}</span>
                </div>
                {course.startDate && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">Starts: {formatDate(course.startDate)}</span>
                  </div>
                )}
                {course.enrollmentDeadline && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-gray-600">Enroll by: {formatDate(course.enrollmentDeadline)}</span>
                  </div>
                )}
                {course.maxParticipants && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-gray-600">
                      {course.enrolledCount}/{course.maxParticipants} enrolled
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-gray-600">{course.viewCount} views</span>
                </div>
              </div>

              {renderEnquiryButton()}
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
              <p className="text-gray-600 whitespace-pre-line">{course.description}</p>
            </Card>

            {/* Skills Taught */}
            {course.skillsTaught && course.skillsTaught.length > 0 && (
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills You Will Learn</h2>
                <div className="flex flex-wrap gap-2">
                  {course.skillsTaught.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Prerequisites</h2>
                <ul className="space-y-2">
                  {course.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-600">
                      <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {prereq}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Certification */}
            {course.certification.offered && (
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Certification</h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {course.certification.name || 'Certificate of Completion'}
                    </h3>
                    {course.certification.issuedBy && (
                      <p className="text-gray-600 text-sm mt-1">
                        Issued by: {course.certification.issuedBy}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm mt-2">
                      Upon successful completion of this course, you will receive a certificate to showcase your new skills.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Schedule */}
            {course.schedule && (
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule</h2>
                <p className="text-gray-600">{course.schedule}</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Training Center Info */}
            {course.trainingCenterProfile && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Center</h2>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {course.trainingCenterProfile.centerName?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {course.trainingCenterProfile.centerName}
                      </h3>
                      {course.trainingCenterProfile.isVerified && (
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {course.trainingCenterProfile.location && (
                      <p className="text-sm text-gray-500">
                        {[course.trainingCenterProfile.location.city, course.trainingCenterProfile.location.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {course.trainingCenterProfile.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {course.trainingCenterProfile.description}
                  </p>
                )}

                {course.trainingCenterProfile.contactInfo && (
                  <div className="space-y-2 text-sm">
                    {course.trainingCenterProfile.contactInfo.email && (
                      <a href={`mailto:${course.trainingCenterProfile.contactInfo.email}`} className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {course.trainingCenterProfile.contactInfo.email}
                      </a>
                    )}
                    {course.trainingCenterProfile.contactInfo.phone && (
                      <a href={`tel:${course.trainingCenterProfile.contactInfo.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {course.trainingCenterProfile.contactInfo.phone}
                      </a>
                    )}
                    {course.trainingCenterProfile.contactInfo.website && (
                      <a href={course.trainingCenterProfile.contactInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Visit Website
                      </a>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Mobile CTA */}
            <div className="lg:hidden">
              {renderEnquiryButton()}
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            {inquirySuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Inquiry Submitted!</h3>
                <p className="text-gray-600">The training center will contact you soon.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Enquire About This Course</h3>
                  <button
                    onClick={() => setShowInquiryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {inquiryError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {inquiryError}
                  </div>
                )}

                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <Input
                    label="Your Name *"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                  <Input
                    label="Email *"
                    type="email"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="What would you like to know about this course?"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInquiryModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      isLoading={inquiryLoading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Submit Inquiry
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
