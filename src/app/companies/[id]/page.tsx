'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import api from '@/lib/api';

interface CompanyProfile {
  _id: string;
  user: string;
  companyName: string;
  industry: string;
  companySize: string;
  foundedYear?: number;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  website?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  contactPerson?: {
    name?: string;
    position?: string;
    email?: string;
    phone?: string;
  };
  socialLinks?: {
    linkedIn?: string;
    twitter?: string;
    facebook?: string;
  };
  benefits?: string[];
  culture?: string;
  isVerified: boolean;
  stats: {
    totalJobs: number;
    activeJobs: number;
  };
}

interface Job {
  _id: string;
  title: string;
  jobType: string;
  location: {
    city?: string;
    country?: string;
    remote?: boolean;
  };
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  postedDate: string;
  applicationDeadline?: string;
  applicationCount?: number;
  status: string;
}

export default function CompanyProfilePage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'about' | 'jobs'>('about');

  useEffect(() => {
    fetchCompanyProfile();
    fetchCompanyJobs();
  }, [companyId]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await api.get(`/employers/profile/${companyId}`);
      setCompany(response.data.data);
    } catch (err) {
      console.error('Error fetching company:', err);
      setError('Company not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyJobs = async () => {
    setJobsLoading(true);
    try {
      const response = await api.get(`/employers/${companyId}/jobs`);
      setJobs(response.data.data);
    } catch (err) {
      console.error('Error fetching company jobs:', err);
    } finally {
      setJobsLoading(false);
    }
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
    if (salary.min) {
      return `From ${formatter.format(salary.min)}`;
    }
    if (salary.max) {
      return `Up to ${formatter.format(salary.max)}`;
    }
    return null;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCompanySizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      '1-10': '1-10 employees',
      '11-50': '11-50 employees',
      '51-200': '51-200 employees',
      '201-500': '201-500 employees',
      '500+': '500+ employees',
    };
    return labels[size] || size;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Company Not Found</h2>
          <p className="text-gray-600 mb-6">This company profile may have been removed or is not available.</p>
          <Link href="/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-600 to-blue-800">
        {company.coverImage && (
          <img
            src={company.coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        {/* Company Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {company.logo ? (
                <img src={company.logo} alt={company.companyName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-400">
                  {company.companyName[0]}
                </span>
              )}
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{company.companyName}</h1>
                {company.isVerified && (
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-lg text-gray-600 mb-3">{company.industry}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {company.location?.city && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {company.location.city}{company.location.country ? `, ${company.location.country}` : ''}
                  </span>
                )}
                {company.companySize && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {getCompanySizeLabel(company.companySize)}
                  </span>
                )}
                {company.foundedYear && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Founded {company.foundedYear}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer">
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
              <p className="text-2xl font-bold text-blue-600">{company.stats.activeJobs}</p>
              <p className="text-sm text-gray-500">Open Positions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{company.stats.totalJobs}</p>
              <p className="text-sm text-gray-500">Total Jobs Posted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{company.companySize || '-'}</p>
              <p className="text-sm text-gray-500">Company Size</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{company.foundedYear || '-'}</p>
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
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Open Positions ({company.stats.activeJobs})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              {company.description && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About {company.companyName}</h2>
                  <p className="text-gray-600 whitespace-pre-line">{company.description}</p>
                </Card>
              )}

              {/* Culture */}
              {company.culture && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Culture</h2>
                  <p className="text-gray-600 whitespace-pre-line">{company.culture}</p>
                </Card>
              )}

              {/* Benefits */}
              {company.benefits && company.benefits.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits & Perks</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {company.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-600">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {benefit}
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
                  {company.contactPerson?.name && (
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium text-gray-900">{company.contactPerson.name}</p>
                      {company.contactPerson.position && (
                        <p className="text-sm text-gray-600">{company.contactPerson.position}</p>
                      )}
                    </div>
                  )}
                  {company.contactPerson?.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${company.contactPerson.email}`} className="text-blue-600 hover:underline">
                        {company.contactPerson.email}
                      </a>
                    </div>
                  )}
                  {company.contactPerson?.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href={`tel:${company.contactPerson.phone}`} className="text-blue-600 hover:underline">
                        {company.contactPerson.phone}
                      </a>
                    </div>
                  )}
                  {company.location?.address && (
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-900">
                        {company.location.address}
                        {company.location.city && <>, {company.location.city}</>}
                        {company.location.state && <>, {company.location.state}</>}
                        {company.location.country && <>, {company.location.country}</>}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Social Links */}
              {(company.socialLinks?.linkedIn || company.socialLinks?.twitter || company.socialLinks?.facebook || company.website) && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect With Us</h3>
                  <div className="flex flex-wrap gap-3">
                    {company.website && (
                      <a
                        href={company.website}
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
                    {company.socialLinks?.linkedIn && (
                      <a
                        href={company.socialLinks.linkedIn}
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
                    {company.socialLinks?.twitter && (
                      <a
                        href={company.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 rounded-lg text-sky-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                        Twitter
                      </a>
                    )}
                    {company.socialLinks?.facebook && (
                      <a
                        href={company.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                      </a>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Jobs Tab */
          <div className="pb-8">
            {jobsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : jobs.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Open Positions</h3>
                <p className="text-gray-600 mb-6">
                  {company.companyName} doesn&apos;t have any open positions right now. Check back later!
                </p>
                <Link href="/jobs">
                  <Button variant="outline">Browse All Jobs</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <Link key={job._id} href={`/jobs/${job._id}`}>
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-600">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {job.location?.remote ? 'Remote' : `${job.location?.city || ''}, ${job.location?.country || ''}`}
                            </span>
                            <Badge variant="default" className="capitalize">
                              {job.jobType?.replace('-', ' ')}
                            </Badge>
                            {formatSalary(job.salary) && (
                              <span className="text-green-600 font-medium">{formatSalary(job.salary)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <p className="text-gray-500">Posted</p>
                            <p className="font-medium text-gray-900">{formatDate(job.postedDate)}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
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
