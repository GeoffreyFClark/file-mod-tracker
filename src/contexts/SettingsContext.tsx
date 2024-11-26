import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';

interface Settings {
  fileSystemCurrentSession: boolean;
  fileSystemPastSessions: boolean;
  registryCurrentSession: boolean;
  registryPastSessions: boolean;
}

interface SettingsContextType extends Settings {
  setFileSystemCurrentSession: (value: boolean) => void;
  setFileSystemPastSessions: (value: boolean) => void;
  setRegistryCurrentSession: (value: boolean) => void;
  setRegistryPastSessions: (value: boolean) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  fileSystemCurrentSession: true,
  fileSystemPastSessions: false,
  registryCurrentSession: true,
  registryPastSessions: false,
};

const SETTINGS_STORAGE_KEY = 'appSettings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return storedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
      return DEFAULT_SETTINGS;
    }
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [settings]);

  // Create individual setters for each setting
  const setFileSystemCurrentSession = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, fileSystemCurrentSession: value }));
  }, []);

  const setFileSystemPastSessions = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, fileSystemPastSessions: value }));
  }, []);

  const setRegistryCurrentSession = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, registryCurrentSession: value }));
  }, []);

  const setRegistryPastSessions = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, registryPastSessions: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      ...settings,
      setFileSystemCurrentSession,
      setFileSystemPastSessions,
      setRegistryCurrentSession,
      setRegistryPastSessions,
      resetToDefaults,
    }),
    [
      settings,
      setFileSystemCurrentSession,
      setFileSystemPastSessions,
      setRegistryCurrentSession,
      setRegistryPastSessions,
      resetToDefaults
    ]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook for using the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};