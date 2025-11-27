import { HTMLAttributes, forwardRef } from 'react';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  label?: string;
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      size = 'md',
      variant = 'primary',
      label,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizes = {
      xs: 'h-3 w-3 border',
      sm: 'h-4 w-4 border-2',
      md: 'h-8 w-8 border-2',
      lg: 'h-12 w-12 border-3',
      xl: 'h-16 w-16 border-4',
    };

    const variants = {
      primary: 'border-blue-600 border-t-transparent',
      secondary: 'border-gray-600 border-t-transparent',
      white: 'border-white border-t-transparent',
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label || 'Loading'}
        className={`flex flex-col items-center justify-center gap-3 ${className}`}
        {...props}
      >
        <div
          className={`animate-spin rounded-full ${sizes[size]} ${variants[variant]}`}
        />
        {label && (
          <span className="text-sm text-gray-600 font-medium">{label}</span>
        )}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;
