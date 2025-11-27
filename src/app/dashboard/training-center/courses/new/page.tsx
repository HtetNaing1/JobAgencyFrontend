'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button, Input } from '@/components/ui';
import api from '@/lib/api';

const categories = [
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
  'Personal Development',
  'Other'
];

const levels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all-levels', label: 'All Levels' }
];

const modes = [
  { value: 'online', label: 'Online' },
  { value: 'in-person', label: 'In-Person' },
  { value: 'hybrid', label: 'Hybrid' }
];

const durationUnits = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' }
];

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [centerName, setCenterName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    skillsTaught: [] as string[],
    level: 'all-levels',
    duration: {
      value: '',
      unit: 'weeks'
    },
    mode: 'online',
    schedule: '',
    price: {
      amount: '',
      currency: 'USD',
      isFree: false
    },
    startDate: '',
    enrollmentDeadline: '',
    maxParticipants: '',
    prerequisites: [] as string[],
    certification: {
      offered: false,
      name: '',
      issuedBy: ''
    },
    status: 'draft'
  });

  useEffect(() => {
    fetchCenterProfile();
  }, []);

  const fetchCenterProfile = async () => {
    try {
      const response = await api.get('/training-centers/profile');
      if (response.data.data?.centerName) {
        setCenterName(response.data.data.centerName);
      }
    } catch (err) {
      console.error('Error fetching center profile:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skillsTaught.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsTaught: [...prev.skillsTaught, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skillsTaught: prev.skillsTaught.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        duration: {
          value: parseInt(formData.duration.value) || 1,
          unit: formData.duration.unit
        },
        price: {
          amount: formData.price.isFree ? 0 : parseFloat(formData.price.amount) || 0,
          currency: formData.price.currency,
          isFree: formData.price.isFree
        },
        certification: {
          ...formData.certification,
          issuedBy: centerName || formData.certification.issuedBy
        },
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        status: saveAsDraft ? 'draft' : 'published'
      };

      await api.post('/courses', payload);
      router.push('/dashboard/training-center/courses');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['training_center']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
            <p className="text-gray-600 mt-2">Fill in the details to create a new training course</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)}>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h2>
              <div className="space-y-4">
                <Input
                  label="Course Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Full Stack Web Development Bootcamp"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Describe what students will learn, course objectives, and key takeaways..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Level
                    </label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                    >
                      {levels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mode *
                    </label>
                    <select
                      name="mode"
                      value={formData.mode}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                      required
                    >
                      {modes.map(mode => (
                        <option key={mode.value} value={mode.value}>{mode.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Skills */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills Taught</h2>
              <div className="flex gap-2 mb-3">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill (e.g., React, Python)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} variant="outline">
                  Add
                </Button>
              </div>
              {formData.skillsTaught.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skillsTaught.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-purple-900"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Duration & Schedule */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Duration & Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label="Duration *"
                      name="duration.value"
                      type="number"
                      value={formData.duration.value}
                      onChange={handleChange}
                      placeholder="e.g., 12"
                      min="1"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">&nbsp;</label>
                    <select
                      name="duration.unit"
                      value={formData.duration.unit}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                    >
                      {durationUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="Schedule"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  placeholder="e.g., Mon-Fri 9AM-5PM, Self-paced"
                />
                <Input
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                />
                <Input
                  label="Enrollment Deadline"
                  name="enrollmentDeadline"
                  type="date"
                  value={formData.enrollmentDeadline}
                  onChange={handleChange}
                />
                <Input
                  label="Max Participants"
                  name="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>
            </Card>

            {/* Pricing */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="price.isFree"
                    checked={formData.price.isFree}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">This is a free course</span>
                </label>
                {!formData.price.isFree && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Price *"
                      name="price.amount"
                      type="number"
                      value={formData.price.amount}
                      onChange={handleChange}
                      placeholder="e.g., 499"
                      min="0"
                      required={!formData.price.isFree}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Currency
                      </label>
                      <select
                        name="price.currency"
                        value={formData.price.currency}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Certification */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Certification</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="certification.offered"
                    checked={formData.certification.offered}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Certificate offered upon completion</span>
                </label>
                {formData.certification.offered && (
                  <div className="space-y-3">
                    <Input
                      label="Certificate Name"
                      name="certification.name"
                      value={formData.certification.name}
                      onChange={handleChange}
                      placeholder="e.g., Full Stack Developer Certificate"
                    />
                    {centerName && (
                      <p className="text-sm text-gray-600">
                        Certificate will be issued by: <span className="font-medium text-gray-900">{centerName}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                disabled={loading}
              >
                Save as Draft
              </Button>
              <Button
                type="submit"
                isLoading={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Publish Course
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
