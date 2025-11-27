import { HTMLAttributes, forwardRef } from 'react';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      size = 'md',
      variant = 'primary',
      showLabel = false,
      label,
      animated = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    };

    const variants = {
      primary: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      success: 'bg-gradient-to-r from-emerald-500 to-green-500',
      warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
      danger: 'bg-gradient-to-r from-red-500 to-rose-500',
    };

    return (
      <div ref={ref} className={className} {...props}>
        {(showLabel || label) && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {label || 'Progress'}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={`
              ${sizes[size]}
              ${variants[variant]}
              rounded-full
              transition-all duration-500 ease-out
              ${animated && percentage < 100 ? 'animate-pulse' : ''}
            `}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// Circular Progress variant
interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      value,
      max = 100,
      size = 48,
      strokeWidth = 4,
      variant = 'primary',
      showLabel = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const variantColors = {
      primary: 'text-blue-600',
      success: 'text-emerald-600',
      warning: 'text-amber-600',
      danger: 'text-red-600',
    };

    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            className="text-gray-200"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={`${variantColors[variant]} transition-all duration-500 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {showLabel && (
          <span className="absolute text-sm font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';

export default Progress;
