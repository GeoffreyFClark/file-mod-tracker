import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the home SVG
const homeSvg = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="h-5 w-5 flex-shrink-0"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
      clip-rule="evenodd"
    />
  </svg>
);

interface BreadcrumbItem {
  name?: string; // Make `name` optional since we may use an icon instead
  href: string;
  current?: boolean;
  svg?: ReactNode; // Optional svg property for icons
}

interface BreadcrumbContextProps {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
}

interface BreadcrumbProviderProps {
  children: ReactNode;
}

const BreadcrumbContext = createContext<BreadcrumbContextProps | undefined>(undefined);

export const BreadcrumbProvider: React.FC<BreadcrumbProviderProps> = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { href: '/', svg: homeSvg }, // Use the home icon instead of 'Home' text
  ]);

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumbs = (): BreadcrumbContextProps => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
};
