import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export function useDirectoryMonitor() {
  const [directories, setDirectories] = useState<string[]>([]);
  const [fileChanges, setFileChanges] = useState<string[]>([]);

  useEffect(() => {
    console.log("Setting up event listener");
    let unlisten: UnlistenFn;

    const setupListener = async () => {
      unlisten = await listen('file-change-event', (event) => {
        console.log("Received file-change-event:", event.payload);
        setFileChanges((prev) => [...prev, event.payload as string]);
      });
    };

    setupListener();

    return () => {
      console.log("Cleaning up event listener");
      if (unlisten) unlisten();
    };
  }, []);

  const startMonitoring = useCallback(async () => {
    try {
      console.log("Invoking start_monitoring with directories:", directories);
      await invoke('start_monitoring', { directories });
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  }, [directories]);

  const addDirectory = useCallback((dir: string) => {
    console.log("Adding directory:", dir);
    setDirectories((prev) => [...prev, dir]);
  }, []);

  return {
    directories,
    fileChanges,
    startMonitoring,
    addDirectory
  };
}