'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      size = 'md',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    const sizes = {
      sm: {
        checkbox: 'w-4 h-4',
        label: 'text-sm',
        description: 'text-xs',
      },
      md: {
        checkbox: 'w-5 h-5',
        label: 'text-sm',
        description: 'text-sm',
      },
      lg: {
        checkbox: 'w-6 h-6',
        label: 'text-base',
        description: 'text-sm',
      },
    };

    const currentSize = sizes[size];

    return (
      <div className={className}>
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative flex items-center justify-center">
            <input
              ref={ref}
              type="checkbox"
              id={inputId}
              className={`
                ${currentSize.checkbox}
                appearance-none
                rounded
                border-2
                transition-all duration-200
                cursor-pointer
                ${error
                  ? 'border-red-300 checked:bg-red-600 checked:border-red-600'
                  : 'border-gray-300 checked:bg-blue-600 checked:border-blue-600 hover:border-gray-400'
                }
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              {...props}
            />
            <svg
              className={`
                ${currentSize.checkbox}
                absolute pointer-events-none
                text-white
                opacity-0
                transition-opacity duration-200
                [input:checked+&]:opacity-100
              `}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          {(label || description) && (
            <div className="flex-1 min-w-0">
              {label && (
                <span className={`${currentSize.label} font-medium text-gray-900`}>
                  {label}
                </span>
              )}
              {description && (
                <p className={`${currentSize.description} text-gray-500 mt-0.5`}>
                  {description}
                </p>
              )}
            </div>
          )}
        </label>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
