'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button, Badge, Spinner, Alert, Tabs, TabList, TabTrigger, TabContent } from '@/components/ui';
import api from '@/lib/api';

interface EmployerProfile {
  companyName: string;
  industry: string;
  companySize: string;
  foundedYear?: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  website?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  contactPerson: {
    name?: string;
    position?: string;
    email?: string;
    phone?: string;
  };
  socialLinks: {
    linkedIn?: string;
    twitter?: string;
    facebook?: string;
  };
  benefits: string[];
  culture?: string;
  isVerified?: boolean;
  stats?: {
    totalJobs: number;
    activeJobs: number;
  };
}

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Construction',
  'Transportation',
  'Hospitality',
  'Real Estate',
  'Media & Entertainment',
  'Telecommunications',
  'Energy',
  'Agriculture',
  'Government',
  'Non-Profit',
  'Other',
];

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

const defaultProfile: EmployerProfile = {
  companyName: '',
  industry: '',
  companySize: '',
  foundedYear: undefined,
  location: {},
  website: '',
  description: '',
  contactPerson: {},
  socialLinks: {},
  benefits: [],
  culture: '',
};

export default function EmployerProfilePage() {
  const [profile, setProfile] = useState<EmployerProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [completion, setCompletion] = useState(0);
  const [newBenefit, setNewBenefit] = useState('');
  const [activeTab, setActiveTab] = useState('view');

  // Pending image files (for new profiles)
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/employers/profile');
      setProfile(response.data.data);
      setCompletion(response.data.completion || 0);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status !== 404) {
        console.error('Error fetching profile:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'cover') => {
    const formData = new FormData();
    formData.append(type, file);
    const endpoint = type === 'logo' ? '/employers/logo' : '/employers/cover';
    const response = await api.post(endpoint, formData);
    return response.data.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/employers/profile', profile);
      let updatedProfile = response.data.data;

      if (pendingLogo) {
        const logoData = await uploadImage(pendingLogo, 'logo');
        updatedProfile = { ...updatedProfile, logo: logoData.logo };
        setPendingLogo(null);
        setLogoPreview(null);
      }

      if (pendingCover) {
        const coverData = await uploadImage(pendingCover, 'cover');
        updatedProfile = { ...updatedProfile, coverImage: coverData.coverImage };
        setPendingCover(null);
        setCoverPreview(null);
      }

      setProfile(updatedProfile);
      setCompletion(response.data.completion || 0);
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      setActiveTab('view');
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingLogo(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingCover(file);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [logoPreview, coverPreview]);

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setProfile(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()],
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setProfile(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const getCompanySizeLabel = (size: string) => {
    const found = companySizes.find(s => s.value === size);
    return found?.label || size;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['employer']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner size="lg" label="Loading profile..." />
        </div>
      </ProtectedRoute>
    );
  }

  const hasProfile = profile.companyName && profile.industry;

  return (
    <ProtectedRoute allowedRoles={['employer']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
              <p className="text-gray-600 mt-1">Manage your company information visible to job seekers</p>
            </div>
          </div>

          {/* Completion Progress */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-medium text-blue-600">{completion}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${completion}%` }}
              ></div>
            </div>
            {completion < 70 && (
              <p className="text-sm text-gray-500 mt-2">
                Complete at least 70% to have your profile visible to job seekers
              </p>
            )}
          </Card>

          {/* Message */}
          {message.text && (
            <Alert
              variant={message.type === 'success' ? 'success' : 'error'}
              className="mb-6"
              dismissible
              onDismiss={() => setMessage({ type: '', text: '' })}
            >
              {message.text}
            </Alert>
          )}

          {/* Tabs */}
          <Tabs defaultValue={hasProfile ? 'view' : 'edit'} value={activeTab} onValueChange={setActiveTab}>
            <TabList variant="default" className="mb-6">
              <TabTrigger value="view" variant="default" disabled={!hasProfile}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Profile
              </TabTrigger>
              <TabTrigger value="edit" variant="default">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </TabTrigger>
            </TabList>

            {/* View Mode */}
            <TabContent value="view">
              {hasProfile ? (
                <div className="space-y-6 pb-8">
                  {/* Preview Banner */}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Profile Preview</p>
                      <p className="text-sm text-blue-700">This is how job seekers will see your company profile</p>
                    </div>
                  </div>

                  {/* Cover & Header Card */}
                  <Card className="overflow-hidden">
                    {/* Cover Image */}
                    <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                      {profile.coverImage && (
                        <img
                          src={profile.coverImage}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/10"></div>
                    </div>

                    {/* Profile Header */}
                    <div className="p-6 -mt-16 relative">
                      <div className="flex flex-col md:flex-row md:items-end gap-4">
                        {/* Logo */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {profile.logo ? (
                            <img src={profile.logo} alt={profile.companyName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl font-bold text-gray-400">
                              {profile.companyName[0]}
                            </span>
                          )}
                        </div>

                        {/* Company Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.companyName}</h2>
                            {profile.isVerified && (
                              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-lg text-gray-600 mb-3">{profile.industry}</p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            {profile.location?.city && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {profile.location.city}{profile.location.country ? `, ${profile.location.country}` : ''}
                              </span>
                            )}
                            {profile.companySize && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {getCompanySizeLabel(profile.companySize)}
                              </span>
                            )}
                            {profile.foundedYear && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Founded {profile.foundedYear}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          {profile.website && (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer">
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
                      {profile.stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{profile.stats.activeJobs}</p>
                            <p className="text-sm text-gray-500">Open Positions</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{profile.stats.totalJobs}</p>
                            <p className="text-sm text-gray-500">Total Jobs Posted</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{profile.companySize || '-'}</p>
                            <p className="text-sm text-gray-500">Company Size</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{profile.foundedYear || '-'}</p>
                            <p className="text-sm text-gray-500">Founded</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* About */}
                      {profile.description && (
                        <Card className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">About {profile.companyName}</h3>
                          <p className="text-gray-600 whitespace-pre-line">{profile.description}</p>
                        </Card>
                      )}

                      {/* Culture */}
                      {profile.culture && (
                        <Card className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Company Culture</h3>
                          <p className="text-gray-600 whitespace-pre-line">{profile.culture}</p>
                        </Card>
                      )}

                      {/* Benefits */}
                      {profile.benefits && profile.benefits.length > 0 && (
                        <Card className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Benefits & Perks</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {profile.benefits.map((benefit, index) => (
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

                      {/* No content message */}
                      {!profile.description && !profile.culture && (!profile.benefits || profile.benefits.length === 0) && (
                        <Card className="p-8 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Add More Details</h4>
                          <p className="text-gray-600 mb-4">
                            Add a company description, culture information, and benefits to make your profile more attractive to candidates.
                          </p>
                          <Button variant="outline" onClick={() => setActiveTab('edit')}>
                            Complete Profile
                          </Button>
                        </Card>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      {/* Contact */}
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                        <div className="space-y-3">
                          {profile.contactPerson?.name ? (
                            <>
                              <div>
                                <p className="text-sm text-gray-500">Contact Person</p>
                                <p className="font-medium text-gray-900">{profile.contactPerson.name}</p>
                                {profile.contactPerson.position && (
                                  <p className="text-sm text-gray-600">{profile.contactPerson.position}</p>
                                )}
                              </div>
                              {profile.contactPerson.email && (
                                <div>
                                  <p className="text-sm text-gray-500">Email</p>
                                  <a href={`mailto:${profile.contactPerson.email}`} className="text-blue-600 hover:underline">
                                    {profile.contactPerson.email}
                                  </a>
                                </div>
                              )}
                              {profile.contactPerson.phone && (
                                <div>
                                  <p className="text-sm text-gray-500">Phone</p>
                                  <a href={`tel:${profile.contactPerson.phone}`} className="text-blue-600 hover:underline">
                                    {profile.contactPerson.phone}
                                  </a>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No contact information added yet.</p>
                          )}
                          {profile.location?.address && (
                            <div>
                              <p className="text-sm text-gray-500">Address</p>
                              <p className="text-gray-900">
                                {profile.location.address}
                                {profile.location.city && <>, {profile.location.city}</>}
                                {profile.location.state && <>, {profile.location.state}</>}
                                {profile.location.country && <>, {profile.location.country}</>}
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Social Links */}
                      {(profile.socialLinks?.linkedIn || profile.socialLinks?.twitter || profile.socialLinks?.facebook || profile.website) && (
                        <Card className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect With Us</h3>
                          <div className="flex flex-wrap gap-3">
                            {profile.website && (
                              <a
                                href={profile.website}
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
                            {profile.socialLinks?.linkedIn && (
                              <a
                                href={profile.socialLinks.linkedIn}
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
                            {profile.socialLinks?.twitter && (
                              <a
                                href={profile.socialLinks.twitter}
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
                            {profile.socialLinks?.facebook && (
                              <a
                                href={profile.socialLinks.facebook}
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
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Profile Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your company profile to start attracting candidates.
                  </p>
                  <Button onClick={() => setActiveTab('edit')}>Create Profile</Button>
                </Card>
              )}
            </TabContent>

            {/* Edit Mode */}
            <TabContent value="edit">
              <form onSubmit={handleSubmit}>
                {/* Images Section */}
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Images</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                          {logoPreview || profile.logo ? (
                            <img src={logoPreview || profile.logo} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoSelect}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label htmlFor="logo-upload">
                            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                              {pendingLogo ? 'Change Logo' : 'Upload Logo'}
                            </Button>
                          </label>
                          <p className="text-xs text-gray-500 mt-1">200x200px recommended</p>
                          {pendingLogo && (
                            <p className="text-xs text-blue-600 mt-1">Will be uploaded when you save</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                          {coverPreview || profile.coverImage ? (
                            <img src={coverPreview || profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverSelect}
                            className="hidden"
                            id="cover-upload"
                          />
                          <label htmlFor="cover-upload">
                            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('cover-upload')?.click()}>
                              {pendingCover ? 'Change Cover' : 'Upload Cover'}
                            </Button>
                          </label>
                          <p className="text-xs text-gray-500 mt-1">1200x300px recommended</p>
                          {pendingCover && (
                            <p className="text-xs text-blue-600 mt-1">Will be uploaded when you save</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Basic Info */}
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.companyName}
                        onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={profile.industry}
                        onChange={(e) => setProfile(prev => ({ ...prev, industry: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Industry</option>
                        {industries.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Size <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={profile.companySize}
                        onChange={(e) => setProfile(prev => ({ ...prev, companySize: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Size</option>
                        {companySizes.map(size => (
                          <option key={size.value} value={size.value}>{size.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Founded Year</label>
                      <input
                        type="number"
                        value={profile.foundedYear || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, foundedYear: e.target.value ? parseInt(e.target.value) : undefined }))}
                        min="1800"
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={profile.website || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                      <textarea
                        value={profile.description || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        maxLength={2000}
                        placeholder="Tell job seekers about your company..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{(profile.description || '').length}/2000</p>
                    </div>
                  </div>
                </Card>

                {/* Location */}
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={profile.location?.address || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: { ...prev.location, address: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={profile.location?.city || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: { ...prev.location, city: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                      <input
                        type="text"
                        value={profile.location?.state || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: { ...prev.location, state: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={profile.location?.country || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: { ...prev.location, country: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
                      <input
                        type="text"
                        value={profile.location?.zipCode || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: { ...prev.location, zipCode: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </Card>

                {/* Contact Person */}
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Person</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={profile.contactPerson?.name || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, contactPerson: { ...prev.contactPerson, name: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                      <input
                        type="text"
                        value={profile.contactPerson?.position || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, contactPerson: { ...prev.contactPerson, position: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profile.contactPerson?.email || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, contactPerson: { ...prev.contactPerson, email: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profile.contactPerson?.phone || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, contactPerson: { ...prev.contactPerson, phone: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </Card>

                {/* Social Links */}
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Social Links</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                      <input
                        type="url"
                        value={profile.socialLinks?.linkedIn || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedIn: e.target.value } }))}
                        placeholder="https://linkedin.com/company/..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                      <input
                        type="url"
                        value={profile.socialLinks?.twitter || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                        placeholder="https://twitter.com/..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                      <input
                        type="url"
                        value={profile.socialLinks?.facebook || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: e.target.value } }))}
                        placeholder="https://facebook.com/..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </Card>

                {/* Benefits & Culture */}
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Benefits & Culture</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Benefits</label>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={newBenefit}
                          onChange={(e) => setNewBenefit(e.target.value)}
                          placeholder="e.g., Health Insurance, Remote Work"
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                        />
                        <Button type="button" variant="outline" onClick={addBenefit}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.benefits.map((benefit, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                          >
                            {benefit}
                            <button
                              type="button"
                              onClick={() => removeBenefit(index)}
                              className="hover:text-green-900"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Culture</label>
                      <textarea
                        value={profile.culture || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, culture: e.target.value }))}
                        rows={4}
                        maxLength={1000}
                        placeholder="Describe your company culture, values, and work environment..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{(profile.culture || '').length}/1000</p>
                    </div>
                  </div>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  {hasProfile && (
                    <Button type="button" variant="outline" onClick={() => setActiveTab('view')}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" isLoading={saving} size="lg">
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </TabContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
