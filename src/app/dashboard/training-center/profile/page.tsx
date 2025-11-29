'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button, Input, Spinner, Alert, Tabs, TabList, TabTrigger, TabContent } from '@/components/ui';
import api from '@/lib/api';

interface TrainingCenterProfile {
  centerName: string;
  description?: string;
  specializations: string[];
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  socialLinks?: {
    linkedIn?: string;
    twitter?: string;
    facebook?: string;
  };
  logo?: string;
  coverImage?: string;
  establishedYear?: number;
  isVerified?: boolean;
  stats?: {
    totalCourses: number;
    publishedCourses: number;
    totalInquiries: number;
  };
}

const specializationOptions = [
  'Programming & Development',
  'Data Science & Analytics',
  'Cloud Computing',
  'Cybersecurity',
  'Project Management',
  'Business & Management',
  'Design & Creative',
  'Marketing & Sales',
  'Finance & Accounting',
  'Healthcare',
  'Language & Communication',
  'Personal Development'
];

const defaultProfile: TrainingCenterProfile = {
  centerName: '',
  description: '',
  specializations: [],
  location: {},
  contactInfo: {},
  socialLinks: {},
};

export default function TrainingCenterProfilePage() {
  const [profile, setProfile] = useState<TrainingCenterProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('view');
  const [dataLoaded, setDataLoaded] = useState(false);

  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/training-centers/me/profile');
      const apiProfile = response.data.data;
      setProfile({
        ...defaultProfile,
        ...apiProfile,
        location: { ...defaultProfile.location, ...(apiProfile.location || {}) },
        contactInfo: { ...defaultProfile.contactInfo, ...(apiProfile.contactInfo || {}) },
        socialLinks: { ...defaultProfile.socialLinks, ...(apiProfile.socialLinks || {}) },
        specializations: apiProfile.specializations || [],
      });
      setDataLoaded(true);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 404) {
        setDataLoaded(true);
      } else {
        console.error('Error fetching profile:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'cover') => {
    const formData = new FormData();
    formData.append(type, file);
    const endpoint = type === 'logo' ? '/training-centers/logo' : '/training-centers/cover';
    const response = await api.post(endpoint, formData);
    return response.data.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/training-centers/profile', profile);
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

  const toggleSpecialization = (spec: string) => {
    setProfile(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['training_center']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner size="lg" label="Loading profile..." />
        </div>
      </ProtectedRoute>
    );
  }

  const hasProfile = profile.centerName && profile.contactInfo?.email;

  return (
    <ProtectedRoute allowedRoles={['training_center']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Center Profile</h1>
              <p className="text-gray-600 mt-1">Manage your training center information</p>
            </div>
          </div>

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
          <Tabs defaultValue={hasProfile ? 'view' : 'edit'} value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
            <TabList variant="default" className="mb-6 overflow-x-auto">
              <TabTrigger value="view" variant="default" disabled={!hasProfile} className="whitespace-nowrap">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden sm:inline">View Profile</span>
                <span className="sm:hidden">View</span>
              </TabTrigger>
              <TabTrigger value="edit" variant="default" className="whitespace-nowrap">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </TabTrigger>
            </TabList>

            {/* View Mode */}
            <TabContent value="view">
              {hasProfile ? (
                <div className="space-y-6 pb-8">
                  {/* Preview Banner */}
                  <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-purple-900">Profile Preview</p>
                      <p className="text-sm text-purple-700">This is how learners will see your training center</p>
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div className="relative h-48 md:h-56 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl overflow-hidden">
                    {profile.coverImage && (
                      <img
                        src={profile.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/10"></div>
                  </div>

                  {/* Profile Header Card */}
                  <div className="-mt-16 relative z-10">
                    <Card className="p-6">
                      <div className="flex flex-col md:flex-row md:items-end gap-4">
                        {/* Logo */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {profile.logo ? (
                            <img src={profile.logo} alt={profile.centerName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl font-bold text-gray-400">
                              {profile.centerName[0]}
                            </span>
                          )}
                        </div>

                        {/* Center Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.centerName}</h2>
                            {profile.isVerified && (
                              <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                            {profile.location?.city && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {profile.location.city}{profile.location.country ? `, ${profile.location.country}` : ''}
                              </span>
                            )}
                            {profile.establishedYear && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Est. {profile.establishedYear}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          {profile.contactInfo?.website && (
                            <a href={profile.contactInfo.website} target="_blank" rel="noopener noreferrer">
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
                        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{profile.stats.publishedCourses}</p>
                            <p className="text-sm text-gray-500">Published Courses</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{profile.stats.totalCourses}</p>
                            <p className="text-sm text-gray-500">Total Courses</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{profile.stats.totalInquiries}</p>
                            <p className="text-sm text-gray-500">Inquiries</p>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* About */}
                      {profile.description && (
                        <Card className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">About Us</h3>
                          <p className="text-gray-600 whitespace-pre-line">{profile.description}</p>
                        </Card>
                      )}

                      {/* Specializations */}
                      {profile.specializations && profile.specializations.length > 0 && (
                        <Card className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Specializations</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.specializations.map((spec, index) => (
                              <span key={index} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                {spec}
                              </span>
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
                          {profile.contactInfo?.email && (
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <a href={`mailto:${profile.contactInfo.email}`} className="text-purple-600 hover:underline">
                                {profile.contactInfo.email}
                              </a>
                            </div>
                          )}
                          {profile.contactInfo?.phone && (
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <a href={`tel:${profile.contactInfo.phone}`} className="text-purple-600 hover:underline">
                                {profile.contactInfo.phone}
                              </a>
                            </div>
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
                      {(profile.socialLinks?.linkedIn || profile.socialLinks?.twitter || profile.socialLinks?.facebook || profile.contactInfo?.website) && (
                        <Card className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect With Us</h3>
                          <div className="flex flex-wrap gap-3">
                            {profile.contactInfo?.website && (
                              <a
                                href={profile.contactInfo.website}
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
                    Create your training center profile to start attracting learners.
                  </p>
                  <Button onClick={() => setActiveTab('edit')} className="bg-purple-600 hover:bg-purple-700">Create Profile</Button>
                </Card>
              )}
            </TabContent>

            {/* Edit Mode */}
            <TabContent value="edit">
              <form onSubmit={handleSubmit} key={`edit-form-${dataLoaded ? 'loaded' : 'initial'}`}>
                {/* Images Section */}
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Center Images</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Center Logo</label>
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
                        Center Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.centerName}
                        onChange={(e) => setProfile(prev => ({ ...prev, centerName: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year Established</label>
                      <input
                        type="number"
                        value={profile.establishedYear || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, establishedYear: e.target.value ? parseInt(e.target.value) : undefined }))}
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={profile.description || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        maxLength={2000}
                        placeholder="Describe your training center..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{(profile.description || '').length}/2000</p>
                    </div>
                  </div>
                </Card>

                {/* Specializations */}
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Specializations</h2>
                  <p className="text-sm text-gray-500 mb-4">Select the areas your training center specializes in</p>
                  <div className="flex flex-wrap gap-2">
                    {specializationOptions.map(spec => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          profile.specializations.includes(spec)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
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
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={profile.location?.city || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: { ...prev.location, city: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                      <input
                        type="text"
                        value={profile.location?.state || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: { ...prev.location, state: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={profile.location?.country || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: { ...prev.location, country: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
                      <input
                        type="text"
                        value={profile.location?.zipCode || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: { ...prev.location, zipCode: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </Card>

                {/* Contact Info */}
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={profile.contactInfo?.email || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profile.contactInfo?.phone || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, phone: e.target.value } }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={profile.contactInfo?.website || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, website: e.target.value } }))}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                      <input
                        type="url"
                        value={profile.socialLinks?.twitter || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                        placeholder="https://twitter.com/..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                      <input
                        type="url"
                        value={profile.socialLinks?.facebook || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: e.target.value } }))}
                        placeholder="https://facebook.com/..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
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
                  <Button type="submit" isLoading={saving} size="lg" className="bg-purple-600 hover:bg-purple-700">
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
