'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
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
  benefits: string[];
  employerProfile: {
    companyName: string;
    logo: string;
    industry: string;
    companySize: string;
    description: string;
    website: string;
    location: {
      city: string;
      country: string;
    };
    benefits: string[];
  };
  postedDate: string;
  applicationDeadline: string;
  viewCount: number;
  applicationCount: number;
}

interface ApplicationStatus {
  hasApplied: boolean;
  application?: {
    status: string;
    appliedDate: string;
  };
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({ hasApplied: false });
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Resume options
  const [resumeOption, setResumeOption] = useState<'profile' | 'upload'>('profile');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Cover letter options
  const [coverLetterOption, setCoverLetterOption] = useState<'text' | 'file'>('text');
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);

  useEffect(() => {
    fetchJob();
    if (isAuthenticated && user?.role === 'jobseeker') {
      checkApplicationStatus();
      checkBookmarkStatus();
    }
  }, [jobId, isAuthenticated, user]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await api.get(`/bookmarks/check/job/${jobId}`);
      setIsBookmarked(response.data.isBookmarked);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
    }
  };

  const fetchJob = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      setJob(response.data.data);
    } catch (err) {
      console.error('Error fetching job:', err);
      setError('Job not found');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await api.get(`/applications/check/${jobId}`);
      setApplicationStatus(response.data);
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setApplyError('');

    // Validation
    if (resumeOption === 'upload' && !resumeFile) {
      setApplyError('Please select a resume file to upload');
      setApplying(false);
      return;
    }

    if (coverLetterOption === 'file' && !coverLetterFile) {
      setApplyError('Please select a cover letter file to upload');
      setApplying(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('useProfileResume', String(resumeOption === 'profile'));

      // Add resume file if uploading new one
      if (resumeOption === 'upload' && resumeFile) {
        formData.append('resume', resumeFile);
      }

      // Add cover letter (text or file)
      if (coverLetterOption === 'text' && coverLetter.trim()) {
        formData.append('coverLetterText', coverLetter);
      } else if (coverLetterOption === 'file' && coverLetterFile) {
        formData.append('coverLetter', coverLetterFile);
      }

      await api.post('/applications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setApplySuccess(true);
      setApplicationStatus({
        hasApplied: true,
        application: { status: 'pending', appliedDate: new Date().toISOString() }
      });
      // Update application count
      if (job) {
        setJob({ ...job, applicationCount: (job.applicationCount || 0) + 1 });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setApplyError(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (salary: Job['salary']) => {
    if (!salary || (!salary.min && !salary.max)) return 'Not disclosed';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency || 'USD',
      maximumFractionDigits: 0,
    });
    const period = salary.period === 'yearly' ? '/year' : salary.period === 'monthly' ? '/month' : '/hour';
    if (salary.min && salary.max) {
      return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}${period}`;
    }
    return salary.min ? `From ${formatter.format(salary.min)}${period}` : `Up to ${formatter.format(salary.max)}${period}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isDeadlinePassed = (deadline: string) => {
    return deadline && new Date(deadline) < new Date();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      reviewed: 'bg-blue-100 text-blue-700',
      shortlisted: 'bg-green-100 text-green-700',
      interview: 'bg-purple-100 text-purple-700',
      rejected: 'bg-red-100 text-red-700',
      hired: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">This job posting may have been removed or is no longer available.</p>
          <Link href="/jobs">
            <Button>Browse Other Jobs</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {job.employerProfile?.logo ? (
                    <img src={job.employerProfile.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-400">
                      {job.employerProfile?.companyName?.[0] || 'C'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                      <p className="text-lg text-gray-600">{job.employerProfile?.companyName}</p>
                    </div>
                    {applicationStatus.hasApplied && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(applicationStatus.application?.status || 'pending')}`}>
                        {applicationStatus.application?.status === 'pending' ? 'Applied' : applicationStatus.application?.status}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {job.location?.remote ? 'Remote' : `${job.location?.city}, ${job.location?.country}`}
                    </span>
                    <Badge variant="default" className="capitalize">
                      {job.jobType?.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-sm text-gray-500">Salary</p>
                  <p className="font-semibold text-gray-900">{formatSalary(job.salary)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Posted</p>
                  <p className="font-semibold text-gray-900">{formatDate(job.postedDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className={`font-semibold ${isDeadlinePassed(job.applicationDeadline) ? 'text-red-600' : 'text-gray-900'}`}>
                    {job.applicationDeadline ? formatDate(job.applicationDeadline) : 'Open'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Applications</p>
                  <p className="font-semibold text-gray-900">{job.applicationCount || 0}</p>
                </div>
              </div>
            </Card>

            {/* Job Description */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 whitespace-pre-line">{job.description}</p>
              </div>
            </Card>

            {/* Requirements */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>

              {job.requirements?.skills?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.skills.map(skill => (
                      <Badge key={skill} variant="primary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.requirements?.experience && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Experience</h3>
                  <p className="text-gray-600">{job.requirements.experience}</p>
                </div>
              )}

              {job.requirements?.education && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Education</h3>
                  <p className="text-gray-600">{job.requirements.education}</p>
                </div>
              )}
            </Card>

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.map(benefit => (
                    <span key={benefit} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply for this position</h3>

              {isDeadlinePassed(job.applicationDeadline) ? (
                <div className="text-center py-4">
                  <p className="text-red-600 font-medium mb-2">Application deadline has passed</p>
                  <p className="text-sm text-gray-600">This job is no longer accepting applications</p>
                </div>
              ) : applicationStatus.hasApplied ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">Application Submitted</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Applied on {applicationStatus.application?.appliedDate ? formatDate(applicationStatus.application.appliedDate) : 'recently'}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(applicationStatus.application?.status || 'pending')}`}>
                    Status: {applicationStatus.application?.status}
                  </span>
                  <Link href="/applications" className="block mt-4 text-blue-600 text-sm hover:underline">
                    View all applications
                  </Link>
                </div>
              ) : user?.role === 'jobseeker' ? (
                <Button className="w-full" size="lg" onClick={() => setShowApplyModal(true)}>
                  Apply Now
                </Button>
              ) : user?.role === 'employer' ? (
                <p className="text-center text-gray-600 py-4">
                  Employers cannot apply to jobs
                </p>
              ) : user?.role === 'admin' ? (
                <p className="text-center text-gray-600 py-4">
                  Admin users cannot apply to jobs
                </p>
              ) : user?.role === 'training_center' ? (
                <p className="text-center text-gray-600 py-4">
                  Training centers cannot apply to jobs
                </p>
              ) : (
                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full" size="lg">
                      Login to Apply
                    </Button>
                  </Link>
                  <p className="text-center text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-blue-600 hover:underline">
                      Sign up
                    </Link>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
                <BookmarkButton
                  itemId={jobId}
                  itemType="job"
                  isBookmarked={isBookmarked}
                  onToggle={setIsBookmarked}
                  showText
                  size="md"
                />
                <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            </Card>

            {/* Company Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Company</h3>

              <Link href={`/companies/${job.employer}`} className="flex items-center gap-3 mb-4 group">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                  {job.employerProfile?.logo ? (
                    <img src={job.employerProfile.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {job.employerProfile?.companyName?.[0] || 'C'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{job.employerProfile?.companyName}</p>
                  <p className="text-sm text-gray-600">{job.employerProfile?.industry}</p>
                </div>
              </Link>

              {job.employerProfile?.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {job.employerProfile.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                {job.employerProfile?.companySize && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.employerProfile.companySize} employees
                  </div>
                )}
                {job.employerProfile?.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {job.employerProfile.location.city}, {job.employerProfile.location.country}
                  </div>
                )}
                {job.employerProfile?.website && (
                  <a
                    href={job.employerProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Website
                  </a>
                )}
              </div>

              <Link href={`/companies/${job.employer}`} className="mt-4 block">
                <Button variant="outline" className="w-full">
                  View Company Profile
                </Button>
              </Link>
            </Card>

            {/* Similar Jobs (placeholder) */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Jobs</h3>
              <p className="text-gray-600 text-sm">More jobs will appear here based on your interests.</p>
              <Link href="/jobs" className="mt-4 inline-block text-blue-600 text-sm hover:underline">
                Browse all jobs
              </Link>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-lg p-6 animate-scale-in">
            {applySuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted!</h3>
                <p className="text-gray-600 mb-6">
                  Your application for <span className="font-medium">{job.title}</span> at{' '}
                  <span className="font-medium">{job.employerProfile?.companyName}</span> has been submitted successfully.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                    Close
                  </Button>
                  <Link href="/applications">
                    <Button>View Applications</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Apply for Position</h3>
                  <button
                    onClick={() => setShowApplyModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Job Summary */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    {job.employerProfile?.logo ? (
                      <img src={job.employerProfile.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-gray-400">{job.employerProfile?.companyName?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-600">{job.employerProfile?.companyName}</p>
                  </div>
                </div>

                {/* Resume Options */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Resume <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${resumeOption === 'profile' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="resumeOption"
                          value="profile"
                          checked={resumeOption === 'profile'}
                          onChange={() => setResumeOption('profile')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Use profile resume</p>
                          <p className="text-xs text-gray-500">Attach resume from your profile</p>
                        </div>
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${resumeOption === 'upload' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="resumeOption"
                          value="upload"
                          checked={resumeOption === 'upload'}
                          onChange={() => setResumeOption('upload')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Upload new resume</p>
                          <p className="text-xs text-gray-500">PDF, DOC, DOCX (max 5MB)</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </label>
                    </div>

                    {resumeOption === 'upload' && (
                      <div className="mt-3">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="resume-upload"
                        />
                        <label
                          htmlFor="resume-upload"
                          className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                        >
                          {resumeFile ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm font-medium">{resumeFile.name}</span>
                            </div>
                          ) : (
                            <>
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span className="text-sm text-gray-600">Click to select resume file</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Cover Letter <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setCoverLetterOption('text')}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${coverLetterOption === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Type Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverLetterOption('file')}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${coverLetterOption === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Upload File
                      </button>
                    </div>

                    {coverLetterOption === 'text' ? (
                      <div>
                        <textarea
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="Tell the employer why you're a great fit for this role..."
                          rows={5}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                          maxLength={2000}
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{coverLetter.length}/2000</p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="cover-letter-upload"
                        />
                        <label
                          htmlFor="cover-letter-upload"
                          className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                        >
                          {coverLetterFile ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm font-medium">{coverLetterFile.name}</span>
                            </div>
                          ) : (
                            <>
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              <span className="text-sm text-gray-600">Click to upload cover letter (PDF, DOC, DOCX)</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {applyError && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm">{applyError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowApplyModal(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleApply} isLoading={applying}>
                    Submit Application
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
