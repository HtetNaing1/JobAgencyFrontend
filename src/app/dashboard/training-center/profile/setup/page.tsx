'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, Button, Input } from '@/components/ui';
import api from '@/lib/api';

const specializations = [
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

export default function TrainingCenterProfileSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    centerName: '',
    description: '',
    specializations: [] as string[],
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    establishedYear: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, string>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/training-centers/profile', {
        ...formData,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined
      });
      router.push('/dashboard/training-center');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['training_center']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Set Up Your Training Center</h1>
            <p className="text-gray-600 mt-2">Complete your profile to start posting courses</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <Input
                  label="Training Center Name *"
                  name="centerName"
                  value={formData.centerName}
                  onChange={handleChange}
                  placeholder="Enter your training center name"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe your training center, its mission, and what makes it unique..."
                  />
                </div>
                <Input
                  label="Year Established"
                  name="establishedYear"
                  type="number"
                  value={formData.establishedYear}
                  onChange={handleChange}
                  placeholder="e.g., 2010"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </Card>

            {/* Specializations */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Specializations</h2>
              <p className="text-sm text-gray-500 mb-4">Select the areas your training center specializes in</p>
              <div className="flex flex-wrap gap-2">
                {specializations.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialization(spec)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.specializations.includes(spec)
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
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleChange}
                    placeholder="Street address"
                  />
                </div>
                <Input
                  label="City *"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                />
                <Input
                  label="State/Province"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  placeholder="State or Province"
                />
                <Input
                  label="Country *"
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleChange}
                  placeholder="Country"
                  required
                />
                <Input
                  label="ZIP/Postal Code"
                  name="location.zipCode"
                  value={formData.location.zipCode}
                  onChange={handleChange}
                  placeholder="ZIP or Postal Code"
                />
              </div>
            </Card>

            {/* Contact Info */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  name="contactInfo.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
                <Input
                  label="Email *"
                  name="contactInfo.email"
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={handleChange}
                  placeholder="contact@trainingcenter.com"
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label="Website"
                    name="contactInfo.website"
                    value={formData.contactInfo.website}
                    onChange={handleChange}
                    placeholder="https://www.yourwebsite.com"
                  />
                </div>
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
                type="submit"
                isLoading={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
