'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface JobSeekerProfile {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  skills: string[];
  experience: Array<{
    _id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    _id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
  }>;
  resumeUrl: string;
  profilePhoto: string;
}

interface EmployerProfile {
  companyName: string;
  industry: string;
  companySize: string;
  description: string;
  website: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  contactPerson: {
    name: string;
    position: string;
    email: string;
    phone: string;
  };
  logo: string;
  benefits: string[];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<JobSeekerProfile | EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const endpoint = user?.role === 'employer' ? '/employers/profile' : '/jobseekers/profile';
      const response = await api.get(endpoint);
      setProfile(response.data.data);
      setCompletion(response.data.completion || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['jobseeker', 'employer', 'training_center']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute allowedRoles={['jobseeker', 'employer', 'training_center']}>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">Complete your profile to get started</p>
            <Link href="/profile/setup">
              <Button>Complete Profile</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Job Seeker Profile View
  if (user?.role === 'jobseeker') {
    const jsProfile = profile as JobSeekerProfile;
    return (
      <ProtectedRoute allowedRoles={['jobseeker']}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            {/* Profile Header */}
            <Card className="mb-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Link href="/profile/photo" className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {jsProfile.profilePhoto ? (
                      <img src={jsProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      `${jsProfile.firstName?.[0] || ''}${jsProfile.lastName?.[0] || ''}`
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </Link>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {jsProfile.firstName} {jsProfile.lastName}
                      </h1>
                      {jsProfile.location?.city && (
                        <p className="text-gray-600 flex items-center gap-1 mt-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {jsProfile.location.city}, {jsProfile.location.country}
                        </p>
                      )}
                    </div>
                    <Link href="/profile/setup">
                      <Button variant="outline">Edit Profile</Button>
                    </Link>
                  </div>

                  {/* Profile Completion */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Profile Completion</span>
                      <span className="font-medium text-gray-900">{completion}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Bio */}
                {jsProfile.bio && (
                  <Card>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                    <p className="text-gray-600">{jsProfile.bio}</p>
                  </Card>
                )}

                {/* Experience */}
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience</h2>
                  {jsProfile.experience?.length > 0 ? (
                    <div className="space-y-4">
                      {jsProfile.experience.map((exp) => (
                        <div key={exp._id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                            {exp.description && <p className="text-gray-600 mt-2 text-sm">{exp.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No experience added yet</p>
                  )}
                </Card>

                {/* Education */}
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
                  {jsProfile.education?.length > 0 ? (
                    <div className="space-y-4">
                      {jsProfile.education.map((edu) => (
                        <div key={edu._id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                            <p className="text-gray-600">{edu.institution}</p>
                            {edu.fieldOfStudy && <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No education added yet</p>
                  )}
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Skills */}
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
                  {jsProfile.skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {jsProfile.skills.map((skill) => (
                        <Badge key={skill} variant="primary">{skill}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No skills added yet</p>
                  )}
                </Card>

                {/* Resume */}
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Resume</h2>
                    {jsProfile.resumeUrl && (
                      <Link href="/profile/resume">
                        <button className="text-blue-600 text-sm hover:underline">Update</button>
                      </Link>
                    )}
                  </div>
                  {jsProfile.resumeUrl ? (
                    <div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">Resume.pdf</p>
                          <p className="text-gray-500 text-xs">Uploaded</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={jsProfile.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </a>
                        <a
                          href={jsProfile.resumeUrl}
                          download="Resume.pdf"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-3">No resume uploaded</p>
                      <Link href="/profile/resume">
                        <Button variant="outline" size="sm">Upload Resume</Button>
                      </Link>
                    </div>
                  )}
                </Card>

                {/* Contact */}
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
                  <div className="space-y-3">
                    {jsProfile.phone && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {jsProfile.phone}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Employer Profile View
  const empProfile = profile as EmployerProfile;
  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                {empProfile.logo ? (
                  <img src={empProfile.logo} alt="Logo" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  empProfile.companyName?.[0] || 'C'
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{empProfile.companyName}</h1>
                    <p className="text-gray-600">{empProfile.industry}</p>
                    {empProfile.location?.city && (
                      <p className="text-gray-500 text-sm mt-1">
                        {empProfile.location.city}, {empProfile.location.country}
                      </p>
                    )}
                  </div>
                  <Link href="/profile/company/setup">
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About Company</h2>
                <p className="text-gray-600">{empProfile.description || 'No description added'}</p>
              </Card>

              {empProfile.benefits?.length > 0 && (
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h2>
                  <div className="flex flex-wrap gap-2">
                    {empProfile.benefits.map((benefit, index) => (
                      <Badge key={index} variant="success">{benefit}</Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Company Info</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Size</span>
                    <span className="text-gray-900">{empProfile.companySize} employees</span>
                  </div>
                  {empProfile.website && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Website</span>
                      <a href={empProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Visit
                      </a>
                    </div>
                  )}
                </div>
              </Card>

              {empProfile.contactPerson && (
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact Person</h2>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">{empProfile.contactPerson.name}</p>
                    <p className="text-gray-600">{empProfile.contactPerson.position}</p>
                    {empProfile.contactPerson.email && (
                      <p className="text-gray-600">{empProfile.contactPerson.email}</p>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
