import React, { createContext, useContext, useCallback } from 'react';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';

interface NavigationContextType {
  navigateTo: (destination: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

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
      clipRule="evenodd"
    />
  </svg>
);

export const NavigationProvider: React.FC<{ children: React.ReactNode, setSelectedItem: React.Dispatch<React.SetStateAction<string>> }> = ({ children, setSelectedItem }) => {
  const { setBreadcrumbs } = useBreadcrumbs();

  const navigateTo = useCallback((destination: string) => {
    setSelectedItem(destination);
    
    // Convert the destination to a URL-friendly href
    const href = `/${destination.toLowerCase().replace(/\s+/g, '-')}`;
    
    setBreadcrumbs([
      { name: '', href: '/', svg: homeSvg }, // Always show the home icon as the first breadcrumb
      ...(destination !== 'Dashboard' ? [{ name: destination, href, current: true }] : []), // Only add other breadcrumbs if it's not Dashboard
    ]);
  }, [setBreadcrumbs, setSelectedItem]);

  return (
    <NavigationContext.Provider value={{ navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};