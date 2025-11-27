'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
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
  };
  skillsTaught: string[];
  startDate?: string;
  status: string;
}

interface TrainingCenterProfile {
  _id: string;
  user: {
    _id: string;
    email: string;
  };
  centerName: string;
  description?: string;
  specializations?: string[];
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  logo?: string;
  accreditations?: string[];
  establishedYear?: number;
  isVerified: boolean;
  rating?: {
    average: number;
    count: number;
  };
  socialMedia?: {
    linkedIn?: string;
    twitter?: string;
    facebook?: string;
  };
  coursesCount: number;
  courses: Course[];
}

export default function TrainingCenterProfilePage() {
  const params = useParams();
  const centerId = params.id as string;

  const [center, setCenter] = useState<TrainingCenterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'about' | 'courses'>('about');

  useEffect(() => {
    fetchCenterProfile();
  }, [centerId]);

  const fetchCenterProfile = async () => {
    try {
      const response = await api.get(`/training-centers/user/${centerId}`);
      setCenter(response.data.data);
    } catch (err) {
      console.error('Error fetching training center:', err);
      setError('Training center not found');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: Course['price']) => {
    if (price.isFree) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency || 'USD',
      maximumFractionDigits: 0,
    }).format(price.amount);
  };

  const formatDuration = (duration: Course['duration']) => {
    return `${duration.value} ${duration.unit}${duration.value > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !center) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Training Center Not Found</h2>
          <p className="text-gray-600 mb-6">This training center profile may have been removed or is not available.</p>
          <Link href="/training">
            <Button>Browse Training Centers</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Background */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-green-600 to-teal-600">
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        {/* Center Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {center.logo ? (
                <img src={center.logo} alt={center.centerName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-400">
                  {center.centerName[0]}
                </span>
              )}
            </div>

            {/* Center Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{center.centerName}</h1>
                {center.isVerified && (
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {center.specializations && center.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {center.specializations.slice(0, 3).map((spec, index) => (
                    <Badge key={index} variant="default">{spec}</Badge>
                  ))}
                  {center.specializations.length > 3 && (
                    <Badge variant="default">+{center.specializations.length - 3} more</Badge>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {center.location?.city && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {center.location.city}{center.location.country ? `, ${center.location.country}` : ''}
                  </span>
                )}
                {center.establishedYear && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Est. {center.establishedYear}
                  </span>
                )}
                {center.rating && center.rating.count > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {center.rating.average.toFixed(1)} ({center.rating.count} reviews)
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {center.contactInfo?.website && (
                <a href={center.contactInfo.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Website
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{center.coursesCount}</p>
              <p className="text-sm text-gray-500">Courses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{center.specializations?.length || 0}</p>
              <p className="text-sm text-gray-500">Specializations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{center.accreditations?.length || 0}</p>
              <p className="text-sm text-gray-500">Accreditations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{center.establishedYear || '-'}</p>
              <p className="text-sm text-gray-500">Founded</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'about'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'courses'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Courses ({center.coursesCount})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              {center.description && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About {center.centerName}</h2>
                  <p className="text-gray-600 whitespace-pre-line">{center.description}</p>
                </Card>
              )}

              {/* Specializations */}
              {center.specializations && center.specializations.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Specializations</h2>
                  <div className="flex flex-wrap gap-2">
                    {center.specializations.map((spec, index) => (
                      <Badge key={index} variant="default" className="text-sm">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Accreditations */}
              {center.accreditations && center.accreditations.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Accreditations & Certifications</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {center.accreditations.map((accred, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-600">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {accred}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {center.contactInfo?.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${center.contactInfo.email}`} className="text-green-600 hover:underline">
                        {center.contactInfo.email}
                      </a>
                    </div>
                  )}
                  {center.contactInfo?.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${center.contactInfo.phone}`} className="text-green-600 hover:underline">
                        {center.contactInfo.phone}
                      </a>
                    </div>
                  )}
                  {center.location?.address && (
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-900">
                        {center.location.address}
                        {center.location.city && <>, {center.location.city}</>}
                        {center.location.state && <>, {center.location.state}</>}
                        {center.location.country && <>, {center.location.country}</>}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Social Links */}
              {(center.socialMedia?.linkedIn || center.socialMedia?.twitter || center.socialMedia?.facebook || center.contactInfo?.website) && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect With Us</h3>
                  <div className="flex flex-wrap gap-3">
                    {center.contactInfo?.website && (
                      <a
                        href={center.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Website
                      </a>
                    )}
                    {center.socialMedia?.linkedIn && (
                      <a
                        href={center.socialMedia.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn
                      </a>
                    )}
                  </div>
                </Card>
              )}

              {/* Courses CTA */}
              {center.coursesCount > 0 && (
                <Card className="p-6 bg-green-50 border-green-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {center.coursesCount} Course{center.coursesCount !== 1 ? 's' : ''} Available
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Explore learning opportunities at {center.centerName}
                  </p>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setActiveTab('courses')}>
                    View All Courses
                  </Button>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Courses Tab */
          <div className="pb-8">
            {center.courses.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Available</h3>
                <p className="text-gray-600 mb-6">
                  {center.centerName} doesn&apos;t have any published courses right now. Check back later!
                </p>
                <Link href="/training">
                  <Button variant="outline">Browse All Courses</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {center.courses.map(course => (
                  <Link key={course._id} href={`/training/${course._id}`}>
                    <Card className="p-6 h-full hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-green-600">
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="default" className="capitalize">{course.category}</Badge>
                          <span className="text-lg font-bold text-green-600">{formatPrice(course.price)}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                        <div className="mt-auto flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDuration(course.duration)}
                          </span>
                          <Badge variant="default" className="capitalize">{course.level}</Badge>
                          <Badge variant="default" className="capitalize">{course.mode}</Badge>
                          {course.certification?.offered && (
                            <span className="flex items-center gap-1 text-green-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Certified
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
