'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface BookmarkButtonProps {
  itemId: string;
  itemType: 'job' | 'course';
  isBookmarked?: boolean;
  onToggle?: (isBookmarked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export default function BookmarkButton({
  itemId,
  itemType,
  isBookmarked: initialIsBookmarked = false,
  onToggle,
  size = 'md',
  className = '',
  showText = false,
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [loading, setLoading] = useState(false);

  // Only show for job seekers
  if (!user || user.role !== 'jobseeker') {
    return null;
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    setLoading(true);
    try {
      const response = await api.post('/bookmarks/toggle', {
        itemType,
        itemId,
      });

      const newState = response.data.isBookmarked;
      setIsBookmarked(newState);
      onToggle?.(newState);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showText) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isBookmarked
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <svg
          className={iconSizes[size]}
          fill={isBookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        {isBookmarked ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
        isBookmarked
          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={isBookmarked ? 'Remove from saved' : 'Save'}
    >
      <svg
        className={iconSizes[size]}
        fill={isBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    </button>
  );
}
