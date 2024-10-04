import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import useFileMonitor from '../hooks/useFileMonitor';
import { TableDataRow } from '../utils/types';

interface Directory {
  path: string;
  isEnabled: boolean;
}

interface FileMonitorContextType {
  tableData: TableDataRow[];
  addDirectory: () => Promise<string | undefined>;
  addDirectoryByPath: (directory: string) => Promise<void>;
  toggleDirectoryState: (directory: string) => Promise<void>;
  deleteDirectory: (directory: string) => Promise<void>;
  startMonitoring: () => Promise<void>;
  directories: Directory[];
  refreshDirectories: () => Promise<void>;
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

  const refreshDirectories = async () => {
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
  };

  useEffect(() => {
    refreshDirectories();
  }, []);

  useEffect(() => {
    localStorage.setItem(DIRECTORIES_KEY, JSON.stringify(directories));
  }, [directories]);

  const contextValue = useMemo(() => ({
    tableData: fileMonitor.tableData,
    addDirectory: fileMonitor.addDirectory,
    addDirectoryByPath: async (directory: string) => {
      try {
        await fileMonitor.addDirectoryByPath(directory);
        setDirectories(prev => [...prev, { path: directory, isEnabled: true }]);
        console.log(`Added directory: ${directory}`);
      } catch (error) {
        console.error(`Error adding directory ${directory}:`, error);
      }
    },
    toggleDirectoryState: async (directory: string) => {
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
    },
    deleteDirectory: async (directory: string) => {
      try {
        await fileMonitor.removeDirectory(directory);
        setDirectories(prev => prev.filter(dir => dir.path !== directory));
        console.log(`Deleted directory: ${directory}`);
      } catch (error) {
        console.error(`Error deleting directory ${directory}:`, error);
      }
    },
    startMonitoring: fileMonitor.startMonitoring,
    directories,
    refreshDirectories,
  }), [fileMonitor, directories]);

  useEffect(() => {
    const initializeMonitoring = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      await fileMonitor.startMonitoring();
      await refreshDirectories();
    };

    initializeMonitoring();
  }, [fileMonitor]);

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