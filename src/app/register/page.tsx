'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button, Input, PasswordInput, Alert } from '@/components/ui';
import Modal from '@/components/ui/Modal';

type Role = 'jobseeker' | 'employer' | 'training_center';

const roleOptions = [
  {
    value: 'jobseeker' as Role,
    title: 'Job Seeker',
    description: 'Find your next career opportunity',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'blue',
  },
  {
    value: 'employer' as Role,
    title: 'Employer',
    description: 'Find the perfect candidates',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'emerald',
  },
  {
    value: 'training_center' as Role,
    title: 'Training Center',
    description: 'Offer courses & training',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'purple',
  },
];

export default function RegisterPage() {
  const { register, isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'jobseeker' as Role,
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoutes: Record<string, string> = {
        jobseeker: '/dashboard/jobseeker',
        employer: '/dashboard/employer',
        training_center: '/dashboard/training-center',
        admin: '/dashboard/admin',
      };
      window.location.href = dashboardRoutes[user.role] || '/';
    }
  }, [isAuthenticated, user]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const handleRoleSelect = (role: Role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate terms agreement
    if (!formData.agreeToTerms) {
      setErrors({ agreeToTerms: 'You must agree to the Terms of Service and Privacy Policy' });
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await register(formData.email, formData.password, formData.role, formData.agreeToTerms);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      blue: {
        bg: isSelected ? 'bg-blue-50' : 'bg-white',
        border: isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300',
        text: 'text-blue-600',
        icon: isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600',
      },
      emerald: {
        bg: isSelected ? 'bg-emerald-50' : 'bg-white',
        border: isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200 hover:border-gray-300',
        text: 'text-emerald-600',
        icon: isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600',
      },
      purple: {
        bg: isSelected ? 'bg-purple-50' : 'bg-white',
        border: isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-200 hover:border-gray-300',
        text: 'text-purple-600',
        icon: isSelected ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600',
      },
    };
    return colors[color];
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">JobAgency</span>
          </Link>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              1
            </div>
            <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              2
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Create your account' : 'Choose your role'}
            </h1>
            <p className="text-gray-600">
              {step === 1 ? (
                <>
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign in
                  </Link>
                </>
              ) : (
                'Select how you want to use JobAgency'
              )}
            </p>
          </div>

          {/* Error Message */}
          {apiError && (
            <Alert variant="error" className="mb-6">
              {apiError}
            </Alert>
          )}

          {/* Step 1: Email & Password */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-5">
              <Input
                label="Email address"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />

              <PasswordInput
                label="Password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                hint="Must be at least 8 characters"
              />

              <PasswordInput
                label="Confirm password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />

              <Button type="submit" className="w-full" size="lg">
                Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </form>
          )}

          {/* Step 2: Role Selection */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                {roleOptions.map((option) => {
                  const isSelected = formData.role === option.value;
                  const colors = getColorClasses(option.color, isSelected);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleRoleSelect(option.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${colors.icon}`}>
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{option.title}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Terms and Privacy Checkbox */}
              <div className="mt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleCheckboxChange}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Back
                </Button>
                <Button type="submit" isLoading={isLoading} className="flex-1">
                  Create Account
                </Button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 border border-white rounded-full" />
          <div className="absolute top-1/3 left-10 w-48 h-48 border border-white rounded-full" />
          <div className="absolute bottom-20 right-1/4 w-24 h-24 border border-white rounded-full" />
        </div>

        <div className="relative flex flex-col justify-center p-12 text-white">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold mb-6">
              Join Our Growing Community
            </h2>
            <p className="text-xl text-indigo-100 mb-12">
              Whether you&apos;re looking for your next opportunity or seeking top talent, we&apos;ve got you covered.
            </p>

            {/* Features List */}
            <div className="space-y-6">
              {[
                { title: 'Smart Job Matching', desc: 'Recommendations based on your skills' },
                { title: 'One-Click Apply', desc: 'Apply to multiple jobs with a single click' },
                { title: 'Real-Time Updates', desc: 'Get instant notifications on your applications' },
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">{feature.title}</p>
                    <p className="text-sm text-indigo-200">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Terms of Service Modal */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto prose prose-sm">
          <p className="text-gray-600 mb-4"><strong>Effective Date:</strong> July 1, 2024</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">1. Acceptance of Terms</h3>
          <p className="text-gray-600">By accessing and using JobAgency, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">2. User Accounts</h3>
          <p className="text-gray-600">You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information during registration and to update your information as needed.</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">3. User Conduct</h3>
          <p className="text-gray-600">Users agree not to:</p>
          <ul className="list-disc list-inside text-gray-600 ml-4">
            <li>Post false or misleading information</li>
            <li>Harass or discriminate against other users</li>
            <li>Upload malicious content or spam</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">4. Job Listings</h3>
          <p className="text-gray-600">Employers are responsible for ensuring job listings are accurate and comply with employment laws. JobAgency reserves the right to remove any listing that violates our policies.</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">5. Intellectual Property</h3>
          <p className="text-gray-600">All content on JobAgency, including logos, text, and graphics, is owned by JobAgency or its licensors and is protected by intellectual property laws.</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">6. Limitation of Liability</h3>
          <p className="text-gray-600">JobAgency is not responsible for the actions of employers or job seekers. We do not guarantee employment outcomes or the accuracy of user-provided information.</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">7. Termination</h3>
          <p className="text-gray-600">We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">8. Changes to Terms</h3>
          <p className="text-gray-600">We may update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.</p>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto prose prose-sm">
          <p className="text-gray-600 mb-4"><strong>Effective Date:</strong> July 1, 2024</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">1. Information We Collect</h3>
          <p className="text-gray-600">We collect information you provide directly, including:</p>
          <ul className="list-disc list-inside text-gray-600 ml-4">
            <li>Account information (email, password)</li>
            <li>Profile information (name, contact details, resume)</li>
            <li>Job applications and course inquiries</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">2. How We Use Your Information</h3>
          <p className="text-gray-600">We use your information to:</p>
          <ul className="list-disc list-inside text-gray-600 ml-4">
            <li>Provide and improve our services</li>
            <li>Match job seekers with employers</li>
            <li>Send notifications about applications and jobs</li>
            <li>Communicate important updates</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">3. Information Sharing</h3>
          <p className="text-gray-600">We share your information with:</p>
          <ul className="list-disc list-inside text-gray-600 ml-4">
            <li>Employers when you apply to jobs</li>
            <li>Training providers when you submit inquiries</li>
            <li>Service providers who assist our operations</li>
          </ul>
          <p className="text-gray-600 mt-2">We do not sell your personal information to third parties.</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">4. Data Security</h3>
          <p className="text-gray-600">We implement appropriate security measures including encryption, secure servers, and access controls to protect your data.</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">5. Your Rights</h3>
          <p className="text-gray-600">You have the right to:</p>
          <ul className="list-disc list-inside text-gray-600 ml-4">
            <li>Access your personal data</li>
            <li>Update or correct your information</li>
            <li>Delete your account and data</li>
            <li>Opt-out of marketing communications</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">6. Cookies</h3>
          <p className="text-gray-600">We use cookies to improve user experience and analyze platform usage. You can manage cookie preferences in your browser settings.</p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">7. Contact Us</h3>
          <p className="text-gray-600">For privacy-related questions, contact us at privacy@jobagency.com</p>
        </div>
      </Modal>
    </div>
  );
}
