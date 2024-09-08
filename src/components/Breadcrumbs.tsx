import React from 'react';
import { useBreadcrumbs } from './BreadcrumbContext';

const Breadcrumbs: React.FC = () => {
  const { breadcrumbs } = useBreadcrumbs();

  return (
    <div className="w-full bg-white py-3 px-4 border-b border-gray-200">
      <nav className="max-w-7xl mx-auto flex" aria-label="Breadcrumb">
        <ol role="list" className="flex items-center space-x-4">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={index}>
              <div className="flex items-center">
                {index > 0 && (
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                )}
                <a
                  href={breadcrumb.href}
                  className={`ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 ${
                    breadcrumb.current ? 'text-indigo-600' : ''
                  }`}
                  aria-current={breadcrumb.current ? 'page' : undefined}
                >
                  {breadcrumb.svg ? breadcrumb.svg : breadcrumb.name}
                </a>
              </div>
            </li>
          ))}

          {/* Conditionally render the separator after home even if it's the only breadcrumb */}
          {breadcrumbs.length === 1 && (
            <li>
              <svg
                className="h-5 w-5 flex-shrink-0 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
            </li>
          )}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumbs;
