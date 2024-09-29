// File: contexts/FileMonitorContext.tsx

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import useFileMonitor from '../hooks/useFileMonitor';
import { TableDataRow } from '../utils/types';

interface Directory {
  path: string;
  isMonitored: boolean;
}

interface FileMonitorContextType {
  tableData: TableDataRow[];
  addDirectory: () => Promise<string | undefined>;
  addDirectoryByPath: (directory: string) => Promise<void>;
  removeDirectory: (directory: string) => Promise<void>;
  startMonitoring: () => Promise<void>;
  directories: Directory[];
}

const FileMonitorContext = createContext<FileMonitorContextType | undefined>(undefined);

export const FileMonitorProvider: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const fileMonitor = useFileMonitor();
  const initializationRef = useRef(false);
  
  // Local state to manage directories with monitoring status
  const [directories, setDirectories] = useState<Directory[]>([]);

  // Fetch all directories with their monitoring status from the backend
  // useEffect(() => {
  //   const fetchAllDirectories = async () => {
  //     try {
  //       const response = await fetch('/api/directories'); // Replace with your actual API endpoint
  //       if (!response.ok) {
  //         throw new Error('Failed to fetch directories');
  //       }
  //       const data: Directory[] = await response.json();
  //       setDirectories(data);
  //       console.log('Fetched all directories:', data);
  //     } catch (error) {
  //       console.error('Error fetching directories:', error);
  //     }
  //   };

  //   fetchAllDirectories();
  // }, []);

  const contextValue = useMemo(() => ({
    tableData: fileMonitor.tableData,
    addDirectory: fileMonitor.addDirectory,
    addDirectoryByPath: async (directory: string) => {
      try {
        await fileMonitor.addDirectoryByPath(directory);
        setDirectories((prev) => {
          // Avoid duplicates
          const exists = prev.find((dir) => dir.path === directory);
          if (exists) {
            return prev.map((dir) =>
              dir.path === directory ? { ...dir, isMonitored: true } : dir
            );
          }
          return [...prev, { path: directory, isMonitored: true }];
        });
        console.log(`Added/Re-enabled directory: ${directory}`);
      } catch (error) {
        console.error(`Error adding directory ${directory}:`, error);
      }
    },
    removeDirectory: async (directory: string) => {
      try {
        await fileMonitor.removeDirectory(directory);
        setDirectories((prev) =>
          prev.map((dir) =>
            dir.path === directory ? { ...dir, isMonitored: false } : dir
          )
        );
        console.log(`Disabled directory: ${directory}`);
      } catch (error) {
        console.error(`Error removing directory ${directory}:`, error);
      }
    },
    startMonitoring: fileMonitor.startMonitoring,
    directories, // Now Directory[]
  }), [fileMonitor, directories]);

  useEffect(() => {
    const initializeMonitoring = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      const defaultDirectory = 'C:\\example';
      await fileMonitor.addDirectoryByPath(defaultDirectory);
      console.log(`Default directory added: ${defaultDirectory}`);

      await fileMonitor.startMonitoring();
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
