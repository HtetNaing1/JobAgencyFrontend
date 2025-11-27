'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import Button from './Button';

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon,
      title,
      description,
      action,
      secondaryAction,
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: {
        container: 'py-8',
        iconWrapper: 'w-12 h-12',
        iconSize: 'w-6 h-6',
        title: 'text-base',
        description: 'text-sm',
      },
      md: {
        container: 'py-12',
        iconWrapper: 'w-16 h-16',
        iconSize: 'w-8 h-8',
        title: 'text-xl',
        description: 'text-base',
      },
      lg: {
        container: 'py-16',
        iconWrapper: 'w-20 h-20',
        iconSize: 'w-10 h-10',
        title: 'text-2xl',
        description: 'text-lg',
      },
    };

    const currentSize = sizes[size];

    const defaultIcon = (
      <svg
        className={`${currentSize.iconSize} text-gray-400`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    );

    return (
      <div
        ref={ref}
        className={`text-center ${currentSize.container} animate-fade-in ${className}`}
        {...props}
      >
        <div
          className={`${currentSize.iconWrapper} mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center`}
        >
          {icon || defaultIcon}
        </div>
        <h3
          className={`${currentSize.title} font-semibold text-gray-900 mb-2`}
        >
          {title}
        </h3>
        {description && (
          <p
            className={`${currentSize.description} text-gray-600 mb-6 max-w-md mx-auto`}
          >
            {description}
          </p>
        )}
        {(action || secondaryAction) && (
          <div className="flex items-center justify-center gap-3">
            {action && (
              <Button
                variant={action.variant || 'primary'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

// Preset empty states for common use cases
export const NoResultsState = ({
  onClear,
  searchTerm,
}: {
  onClear?: () => void;
  searchTerm?: string;
}) => (
  <EmptyState
    icon={
      <svg
        className="w-8 h-8 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    }
    title="No results found"
    description={
      searchTerm
        ? `We couldn't find anything matching "${searchTerm}". Try adjusting your search or filters.`
        : "Try adjusting your search or filters to find what you're looking for."
    }
    action={onClear ? { label: 'Clear filters', onClick: onClear, variant: 'outline' } : undefined}
  />
);

export const NoDataState = ({
  title = 'No data yet',
  description = "There's nothing here yet. Check back later!",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <EmptyState
    icon={
      <svg
        className="w-8 h-8 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    }
    title={title}
    description={description}
    action={actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined}
  />
);

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'An error occurred while loading data. Please try again.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) => (
  <EmptyState
    icon={
      <svg
        className="w-8 h-8 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    }
    title={title}
    description={description}
    action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
  />
);

export default EmptyState;
