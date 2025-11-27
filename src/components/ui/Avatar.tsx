import { HTMLAttributes, forwardRef } from 'react';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      name = '',
      size = 'md',
      status,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
    };

    const statusColors = {
      online: 'bg-emerald-500',
      offline: 'bg-gray-400',
      busy: 'bg-red-500',
      away: 'bg-amber-500',
    };

    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    };

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const getColorFromName = (name: string) => {
      const colors = [
        'bg-blue-500',
        'bg-indigo-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-red-500',
        'bg-orange-500',
        'bg-amber-500',
        'bg-emerald-500',
        'bg-teal-500',
        'bg-cyan-500',
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    return (
      <div
        ref={ref}
        className={`relative inline-flex flex-shrink-0 ${className}`}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name}
            className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`}
          />
        ) : (
          <div
            className={`
              ${sizes[size]}
              ${getColorFromName(name)}
              rounded-full
              flex items-center justify-center
              text-white font-semibold
              ring-2 ring-white
            `}
          >
            {getInitials(name) || (
              <svg
                className="w-1/2 h-1/2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>
        )}
        {status && (
          <span
            className={`
              absolute bottom-0 right-0
              ${statusSizes[size]}
              ${statusColors[status]}
              rounded-full
              ring-2 ring-white
            `}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group component
interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  avatars: Array<{ src?: string; name: string }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ avatars, max = 4, size = 'md', className = '', ...props }, ref) => {
    const visibleAvatars = avatars.slice(0, max);
    const remainingCount = avatars.length - max;

    const overlapSizes = {
      xs: '-ml-1',
      sm: '-ml-2',
      md: '-ml-2.5',
      lg: '-ml-3',
    };

    return (
      <div
        ref={ref}
        className={`flex items-center ${className}`}
        {...props}
      >
        {visibleAvatars.map((avatar, index) => (
          <div
            key={index}
            className={index > 0 ? overlapSizes[size] : ''}
            style={{ zIndex: visibleAvatars.length - index }}
          >
            <Avatar src={avatar.src} name={avatar.name} size={size} />
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={`${overlapSizes[size]} flex items-center justify-center`}
            style={{ zIndex: 0 }}
          >
            <div
              className={`
                ${size === 'xs' ? 'w-6 h-6 text-xs' : ''}
                ${size === 'sm' ? 'w-8 h-8 text-xs' : ''}
                ${size === 'md' ? 'w-10 h-10 text-sm' : ''}
                ${size === 'lg' ? 'w-12 h-12 text-base' : ''}
                rounded-full bg-gray-200
                flex items-center justify-center
                text-gray-600 font-medium
                ring-2 ring-white
              `}
            >
              +{remainingCount}
            </div>
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export default Avatar;
