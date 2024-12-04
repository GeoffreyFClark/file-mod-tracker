import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import useFileMonitor from '../hooks/useFileMonitor';
import { WatcherTableDataRow } from '../utils/types';

declare global {
  interface Window {
    __refreshDirectories: () => Promise<void>;
  }
}

interface Directory {
  path: string;
  isEnabled: boolean;
}

interface FileMonitorContextType {
  tableData: WatcherTableDataRow[];
  addDirectoryByPath: (directory: string) => Promise<void>;
  toggleDirectoryState: (directory: string) => Promise<void>;
  deleteDirectory: (directory: string) => Promise<void>;
  startMonitoring: () => Promise<void>;
  directories: Directory[];
  refreshDirectories: () => Promise<void>;
  resetDirectoryStates: () => void;
}

const FileMonitorContext = createContext<FileMonitorContextType | undefined>(undefined);
const DIRECTORIES_KEY = 'monitoredDirectories';

export const FileMonitorProvider: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const fileMonitor = useFileMonitor();
  const initializationRef = useRef(false);
  
  const [directories, setDirectories] = useState<Directory[]>(() => {
    const savedDirectories = localStorage.getItem(DIRECTORIES_KEY);
    return savedDirectories ? JSON.parse(savedDirectories) : [];
  });

  const resetDirectoryStates = useCallback(() => {
    setDirectories(prev => prev.map(dir => ({
      ...dir,
      isEnabled: false
    })));
  }, []);

  const refreshDirectories = useCallback(async () => {
    try {
      const watchedDirectories = await fileMonitor.getWatchedDirectories();
      setDirectories(prev => {
        const updatedDirectories = prev.map(dir => ({
          ...dir,
          isEnabled: watchedDirectories.includes(dir.path)
        }));
        const newDirectories = watchedDirectories
          .filter(dir => !prev.some(prevDir => prevDir.path === dir))
          .map(dir => ({ path: dir, isEnabled: true }));
        return [...updatedDirectories, ...newDirectories];
      });
    } catch (error) {
      console.error('Error fetching directories:', error);
    }
  }, [fileMonitor]);

  (window as any).__refreshDirectories = refreshDirectories;

  const addDirectoryByPath = useCallback(async (directory: string) => {
    try {
      await fileMonitor.addDirectoryByPath(directory);
      setDirectories(prev => [...prev, { path: directory, isEnabled: true }]);
      console.log(`Added directory: ${directory}`);
    } catch (error) {
      console.error(`Error adding directory ${directory}:`, error);
    }
  }, [fileMonitor]);

  const toggleDirectoryState = useCallback(async (directory: string) => {
    setDirectories(prev => 
      prev.map(dir => 
        dir.path === directory ? { ...dir, isEnabled: !dir.isEnabled } : dir
      )
    );
    const dir = directories.find(d => d.path === directory);
    if (dir) {
      if (dir.isEnabled) {
        await fileMonitor.removeDirectory(directory);
        console.log(`Removed directory from backend: ${directory}`);
      } else {
        await fileMonitor.addDirectoryByPath(directory);
        console.log(`Added directory to backend: ${directory}`);
      }
    }
  }, [fileMonitor, directories]);

  const deleteDirectory = useCallback(async (directory: string) => {
    try {
      await fileMonitor.removeDirectory(directory);
      setDirectories(prev => prev.filter(dir => dir.path !== directory));
      console.log(`Deleted directory: ${directory}`);
    } catch (error) {
      console.error(`Error deleting directory ${directory}:`, error);
    }
  }, [fileMonitor]);

  useEffect(() => {
    const initializeMonitoring = async () => {
      if (initializationRef.current) return;
      try {
        console.log('Starting monitoring system initialization...');
        await fileMonitor.startMonitoring();
        initializationRef.current = true;
        console.log('Monitoring system initialization complete');
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    };
  
    initializeMonitoring();
  }, [fileMonitor]);

  useEffect(() => {
    localStorage.setItem(DIRECTORIES_KEY, JSON.stringify(directories));
  }, [directories]);

  const contextValue = useMemo(() => ({
    tableData: fileMonitor.tableData,
    addDirectoryByPath,
    toggleDirectoryState,
    deleteDirectory,
    startMonitoring: fileMonitor.startMonitoring,
    directories,
    refreshDirectories,
    resetDirectoryStates,
  }), [
    directories,
    addDirectoryByPath,
    toggleDirectoryState,
    deleteDirectory,
    refreshDirectories,
    resetDirectoryStates
  ]);

  return (
    <FileMonitorContext.Provider value={contextValue}>
      {children}
    </FileMonitorContext.Provider>
  );
});

FileMonitorProvider.displayName = 'FileMonitorProvider';

export const useFileMonitorContext = () => {
  const context = useContext(FileMonitorContext);
  if (context === undefined) {
    throw new Error('useFileMonitorContext must be used within a FileMonitorProvider');
  }
  return context;
};