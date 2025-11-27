'use client';

import { HTMLAttributes, forwardRef, ReactNode, createContext, useContext, useState } from 'react';

// Context for tabs
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
};

// Main Tabs container
interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      defaultValue,
      value,
      onValueChange,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const activeTab = value !== undefined ? value : internalValue;

    const setActiveTab = (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

// Tab List (container for tab triggers)
interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'pills' | 'underline';
}

const TabList = forwardRef<HTMLDivElement, TabListProps>(
  ({ variant = 'default', children, className = '', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 p-1 rounded-xl',
      pills: 'gap-2',
      underline: 'border-b border-gray-200 gap-4',
    };

    return (
      <div
        ref={ref}
        role="tablist"
        className={`flex ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabList.displayName = 'TabList';

// Tab Trigger (individual tab button)
interface TabTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
  icon?: ReactNode;
  variant?: 'default' | 'pills' | 'underline';
}

const TabTrigger = forwardRef<HTMLButtonElement, TabTriggerProps>(
  (
    {
      value,
      disabled = false,
      icon,
      variant = 'default',
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;

    const baseStyles = 'flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      default: {
        base: 'px-4 py-2 text-sm rounded-lg',
        active: 'bg-white text-gray-900 shadow-sm',
        inactive: 'text-gray-600 hover:text-gray-900',
      },
      pills: {
        base: 'px-4 py-2 text-sm rounded-full',
        active: 'bg-blue-600 text-white',
        inactive: 'text-gray-600 hover:bg-gray-100',
      },
      underline: {
        base: 'px-1 py-3 text-sm border-b-2 -mb-px',
        active: 'border-blue-600 text-blue-600',
        inactive: 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
      },
    };

    const currentVariant = variants[variant];

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        disabled={disabled}
        onClick={() => setActiveTab(value)}
        className={`
          ${baseStyles}
          ${currentVariant.base}
          ${isActive ? currentVariant.active : currentVariant.inactive}
          ${className}
        `}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);

TabTrigger.displayName = 'TabTrigger';

// Tab Content (content panel for each tab)
interface TabContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabContent = forwardRef<HTMLDivElement, TabContentProps>(
  ({ value, children, className = '', ...props }, ref) => {
    const { activeTab } = useTabsContext();
    const isActive = activeTab === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${value}`}
        className={`animate-fade-in ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabContent.displayName = 'TabContent';

export { Tabs, TabList, TabTrigger, TabContent };
export default Tabs;
