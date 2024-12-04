import { useState, useCallback, useRef, useEffect } from 'react';
import { FileMonitor, FileMonitorState } from './monitor';
import { convertMonitorStateToTableData } from '../utils/convertMonitorStateToTableData';
import { fileLogger } from '../utils/Logger';

const useFileMonitor = () => {
  const [monitorState, setMonitorState] = useState<FileMonitorState>({
    directories: [],
    fileChanges: {},
    fileDetails: {},
  });
  const fileMonitorRef = useRef<FileMonitor | null>(null);

  useEffect(() => {
    if (!fileMonitorRef.current) {
      fileMonitorRef.current = new FileMonitor((newState: FileMonitorState) => {
        setMonitorState(newState);
      });
    }
  }, []);

  // Force write logs on unmount
  useEffect(() => {
    return () => {
      if (tableData.length > 0) {
        fileLogger.forceWrite().catch(error => {
          console.error('Error writing final log:', error);
        });
      }
    };
  }, []);

  const tableData = convertMonitorStateToTableData(monitorState);
  
  // Log table data whenever it changes
  useEffect(() => {
    console.log('tableData changed:', {
      length: tableData?.length,
      isArray: Array.isArray(tableData),
      sample: tableData?.[0]
    });

    if (tableData && Array.isArray(tableData) && tableData.length > 0) {
      fileLogger.logTableData(tableData).catch(error => {
        console.error('Error logging table data:', error);
      });
    }
  }, [tableData]);

  const addDirectoryByPath = useCallback(async (directory: string): Promise<void> => {
    if (fileMonitorRef.current) {
      await fileMonitorRef.current.addDirectoryByPath(directory);
    }
  }, []);

  const startMonitoring = useCallback(async (): Promise<void> => {
    if (fileMonitorRef.current) {
      await fileMonitorRef.current.startMonitoring();
    }
  }, []);

  const removeDirectory = useCallback(async (directory: string): Promise<void> => {
    if (fileMonitorRef.current) {
      await fileMonitorRef.current.removeDirectory(directory);
    }
  }, []);

  const getWatchedDirectories = useCallback(async (): Promise<string[]> => {
    if (fileMonitorRef.current) {
      return fileMonitorRef.current.getWatchedDirectories();
    }
    return [];
  }, []);

  return {
    tableData,
    addDirectoryByPath,
    removeDirectory,
    startMonitoring,
    getWatchedDirectories,
    directories: monitorState.directories,
  };
};

export default useFileMonitor;