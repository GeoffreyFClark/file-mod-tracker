import { useState, useCallback, useRef, useEffect } from 'react';
import { FileMonitor, FileMonitorState } from './monitor';
import { convertMonitorStateToTableData } from '../utils/convertMonitorStateToTableData';
import { TableDataRow } from '../utils/types';
import { invoke } from '@tauri-apps/api/tauri';

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

  const tableData = convertMonitorStateToTableData(monitorState);

  const addDirectory = useCallback(async (): Promise<string | undefined> => {
    if (fileMonitorRef.current) {
      return fileMonitorRef.current.addDirectory();
    }
    return undefined;
  }, []);

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

  return {
    tableData,
    addDirectory,
    addDirectoryByPath,
    removeDirectory, // Add this new function to the returned object
    startMonitoring,
    directories: monitorState.directories,
  };
};

export default useFileMonitor;