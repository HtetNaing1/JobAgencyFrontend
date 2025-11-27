import { HTMLAttributes, forwardRef } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      lines = 1,
      animation = 'pulse',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'bg-gray-200';

    const animations = {
      pulse: 'animate-pulse',
      wave: 'skeleton-wave',
      none: '',
    };

    const variants = {
      text: 'rounded h-4',
      circular: 'rounded-full',
      rectangular: '',
      rounded: 'rounded-xl',
    };

    const style: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    };

    if (lines > 1) {
      return (
        <div ref={ref} className={`space-y-2 ${className}`} {...props}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={`${baseStyles} ${animations[animation]} ${variants[variant]}`}
              style={{
                ...style,
                width: index === lines - 1 ? '75%' : style.width,
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${animations[animation]} ${variants[variant]} ${className}`}
        style={style}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Preset skeleton components for common use cases
export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`p-6 rounded-2xl border border-gray-100 bg-white ${className}`}>
    <div className="flex items-start gap-4">
      <Skeleton variant="rounded" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={16} />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton lines={3} />
    </div>
    <div className="mt-4 flex gap-2">
      <Skeleton variant="rounded" width={80} height={32} />
      <Skeleton variant="rounded" width={80} height={32} />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3, className = '' }: { count?: number; className?: string }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) => (
  <div className={`rounded-2xl border border-gray-100 bg-white overflow-hidden ${className}`}>
    <div className="bg-gray-50 p-4 border-b border-gray-100">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton key={index} width={`${100 / cols}%`} height={16} />
        ))}
      </div>
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} width={`${100 / cols}%`} height={16} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: 32, md: 48, lg: 64 };
  return <Skeleton variant="circular" width={sizes[size]} height={sizes[size]} />;
};

export default Skeleton;
