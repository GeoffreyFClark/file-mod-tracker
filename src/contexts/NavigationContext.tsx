import React, { createContext, useContext, useCallback, useState } from 'react';

interface NavigationContextType {
  selectedItem: string;
  setSelectedItem: (item: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedItem, setSelectedItemState] = useState('Dashboard');

  const setSelectedItem = useCallback((item: string) => {
    setSelectedItemState(item);
    // Add any additional navigation logic here if needed
  }, []);

  return (
    <NavigationContext.Provider value={{ selectedItem, setSelectedItem }}>
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
