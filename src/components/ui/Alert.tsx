'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  icon?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      title,
      icon,
      dismissible = false,
      onDismiss,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const variants = {
      success: {
        container: 'bg-emerald-50 border-emerald-100',
        icon: 'text-emerald-500',
        title: 'text-emerald-800',
        text: 'text-emerald-700',
        dismissBtn: 'text-emerald-500 hover:bg-emerald-100',
      },
      error: {
        container: 'bg-red-50 border-red-100',
        icon: 'text-red-500',
        title: 'text-red-800',
        text: 'text-red-700',
        dismissBtn: 'text-red-500 hover:bg-red-100',
      },
      warning: {
        container: 'bg-amber-50 border-amber-100',
        icon: 'text-amber-500',
        title: 'text-amber-800',
        text: 'text-amber-700',
        dismissBtn: 'text-amber-500 hover:bg-amber-100',
      },
      info: {
        container: 'bg-blue-50 border-blue-100',
        icon: 'text-blue-500',
        title: 'text-blue-800',
        text: 'text-blue-700',
        dismissBtn: 'text-blue-500 hover:bg-blue-100',
      },
    };

    const currentVariant = variants[variant];

    const defaultIcons = {
      success: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={`p-4 rounded-xl border flex items-start gap-3 animate-scale-in ${currentVariant.container} ${className}`}
        {...props}
      >
        <div className={`flex-shrink-0 ${currentVariant.icon}`}>
          {icon || defaultIcons[variant]}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold ${currentVariant.title} mb-1`}>
              {title}
            </h4>
          )}
          <div className={`text-sm ${currentVariant.text}`}>{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`flex-shrink-0 p-1 rounded-lg transition-colors ${currentVariant.dismissBtn}`}
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
