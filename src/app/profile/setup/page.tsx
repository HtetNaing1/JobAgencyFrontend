'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button, Input } from '@/components/ui';
import api from '@/lib/api';

const steps = [
  { id: 1, name: 'Personal Info' },
  { id: 2, name: 'Skills' },
  { id: 3, name: 'Experience' },
  { id: 4, name: 'Education' },
];

interface Experience {
  _id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  _id?: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    bio: '',
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [currentExperience, setCurrentExperience] = useState<Experience>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });

  const [educations, setEducations] = useState<Education[]>([]);
  const [currentEducation, setCurrentEducation] = useState<Education>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
  });

  // Fetch existing profile data on mount
  useEffect(() => {
    fetchExistingProfile();
  }, []);

  const fetchExistingProfile = async () => {
    try {
      const response = await api.get('/jobseekers/profile');
      const profile = response.data.data;

      if (profile) {
        setIsEditMode(true);

        // Populate form data
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          city: profile.location?.city || '',
          state: profile.location?.state || '',
          country: profile.location?.country || '',
          bio: profile.bio || '',
        });

        // Populate skills
        if (profile.skills && profile.skills.length > 0) {
          setSkills(profile.skills);
        }

        // Populate experiences with formatted dates
        if (profile.experience && profile.experience.length > 0) {
          const formattedExperiences = profile.experience.map((exp: Experience) => ({
            ...exp,
            startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
            endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
          }));
          setExperiences(formattedExperiences);
        }

        // Populate educations with formatted dates
        if (profile.education && profile.education.length > 0) {
          const formattedEducations = profile.education.map((edu: Education) => ({
            ...edu,
            startDate: edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : '',
            endDate: edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : '',
          }));
          setEducations(formattedEducations);
        }
      }
    } catch (err) {
      // Profile doesn't exist yet, that's okay
      console.log('No existing profile found');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addExperience = () => {
    if (currentExperience.company && currentExperience.position) {
      setExperiences([...experiences, currentExperience]);
      setCurrentExperience({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      });
    }
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    if (currentEducation.institution && currentEducation.degree) {
      setEducations([...educations, currentEducation]);
      setCurrentEducation({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
      });
    }
  };

  const removeEducation = (index: number) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: {
          city: formData.city,
          state: formData.state,
          country: formData.country,
        },
        bio: formData.bio,
        skills,
        experience: experiences,
        education: educations,
      };

      await api.post('/jobseekers/profile', profileData);
      router.push('/profile');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (initialLoading) {
    return (
      <ProtectedRoute allowedRoles={['jobseeker']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Your Profile' : 'Complete Your Profile'}
            </h1>
            <p className="text-gray-600 mt-2">Let employers know more about you</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep >= step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {step.id}
                  </button>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 sm:w-24 h-1 mx-2 ${
                        currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <Card className="p-6">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Skills */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Skills</h2>
                <div className="flex gap-2">
                  <Input
                    label="Add Skill"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="e.g., JavaScript, React, Node.js"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addSkill} className="mt-6">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                {skills.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No skills added yet. Add your skills to stand out!</p>
                )}
              </div>
            )}

            {/* Step 3: Experience */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Work Experience</h2>

                {/* Added experiences */}
                {experiences.map((exp, index) => (
                  <div key={exp._id || index} className="p-4 bg-gray-50 rounded-xl relative">
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                    <p className="text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500">
                      {exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                    </p>
                    {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                  </div>
                ))}

                {/* Add new experience form */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Add Experience</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Company"
                      value={currentExperience.company}
                      onChange={(e) => setCurrentExperience({ ...currentExperience, company: e.target.value })}
                    />
                    <Input
                      label="Position"
                      value={currentExperience.position}
                      onChange={(e) => setCurrentExperience({ ...currentExperience, position: e.target.value })}
                    />
                    <Input
                      label="Start Date"
                      type="date"
                      value={currentExperience.startDate}
                      onChange={(e) => setCurrentExperience({ ...currentExperience, startDate: e.target.value })}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={currentExperience.endDate}
                      onChange={(e) => setCurrentExperience({ ...currentExperience, endDate: e.target.value })}
                      disabled={currentExperience.current}
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="current"
                      checked={currentExperience.current}
                      onChange={(e) => setCurrentExperience({ ...currentExperience, current: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="current" className="text-sm text-gray-700">I currently work here</label>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={currentExperience.description}
                      onChange={(e) => setCurrentExperience({ ...currentExperience, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={addExperience} className="mt-4">
                    Add Experience
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Education */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>

                {/* Added educations */}
                {educations.map((edu, index) => (
                  <div key={edu._id || index} className="p-4 bg-gray-50 rounded-xl relative">
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                    <p className="text-gray-600">{edu.institution}</p>
                    <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>
                  </div>
                ))}

                {/* Add new education form */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Add Education</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Institution"
                      value={currentEducation.institution}
                      onChange={(e) => setCurrentEducation({ ...currentEducation, institution: e.target.value })}
                    />
                    <Input
                      label="Degree"
                      value={currentEducation.degree}
                      onChange={(e) => setCurrentEducation({ ...currentEducation, degree: e.target.value })}
                    />
                    <Input
                      label="Field of Study"
                      value={currentEducation.fieldOfStudy}
                      onChange={(e) => setCurrentEducation({ ...currentEducation, fieldOfStudy: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Start"
                        type="date"
                        value={currentEducation.startDate}
                        onChange={(e) => setCurrentEducation({ ...currentEducation, startDate: e.target.value })}
                      />
                      <Input
                        label="End"
                        type="date"
                        value={currentEducation.endDate}
                        onChange={(e) => setCurrentEducation({ ...currentEducation, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={addEducation} className="mt-4">
                    Add Education
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Complete Profile'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
