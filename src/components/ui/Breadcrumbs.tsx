'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  showHome?: boolean;
  homeHref?: string;
}

const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  (
    {
      items,
      separator,
      showHome = true,
      homeHref = '/',
      className = '',
      ...props
    },
    ref
  ) => {
    const defaultSeparator = (
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    );

    const homeIcon = (
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
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    );

    const allItems: BreadcrumbItem[] = showHome
      ? [{ label: 'Home', href: homeHref, icon: homeIcon }, ...items]
      : items;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={`${className}`}
        {...props}
      >
        <ol className="flex items-center flex-wrap gap-2">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;

            return (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="flex-shrink-0" aria-hidden="true">
                    {separator || defaultSeparator}
                  </span>
                )}
                {isLast ? (
                  <span
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-900"
                    aria-current="page"
                  >
                    {item.icon}
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    {item.icon}
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';

export default Breadcrumbs;
