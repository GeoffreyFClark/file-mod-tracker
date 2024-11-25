import React, { createContext, useContext, useCallback, useState, useMemo } from 'react';

interface NavigationContextType {
  selectedItem: string;
  setSelectedItem: (item: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedItem, setSelectedItemState] = useState('Home');

  const setSelectedItem = useCallback((item: string) => {
    setSelectedItemState(item);
  }, []);

  // Memoize the context value to ensure stable reference
  const value = useMemo(() => ({
    selectedItem,
    setSelectedItem
  }), [selectedItem, setSelectedItem]);

  return (
    <NavigationContext.Provider value={value}>
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