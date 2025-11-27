import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', className = '', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full';

    const variants = {
      default: 'bg-gray-100 text-gray-700',
      primary: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
      success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
      warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
      danger: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
      info: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
