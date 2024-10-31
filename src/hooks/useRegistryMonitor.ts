import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { RegistryMonitor, RegistryEvent } from './registry-monitor';
import { convertRegistryEventsToTableData } from '../utils/convertMonitorStateToTableData';

const useRegistryMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [events, setEvents] = useState<RegistryEvent[]>([]);
  const registryMonitorRef = useRef<RegistryMonitor | null>(null);
  const isInitializedRef = useRef(false);

  const updateState = useCallback((newIsMonitoring: boolean, newEvents: RegistryEvent[]) => {
    setIsMonitoring(newIsMonitoring);
    
    // Only log and update if there's actually a new event
    if (newEvents.length > events.length) {
      const latestEvent = newEvents[newEvents.length - 1];
      console.log('New registry event:', {
        type: latestEvent.type,
        key: latestEvent.key,
        value: latestEvent.value,
        previousData: latestEvent.previousData,
        newData: latestEvent.newData,
        timestamp: latestEvent.timestamp
      });
    }
    
    setEvents(newEvents);
  }, [events.length]);

  const getChangeCount = useCallback((key: string): number => {
    return registryMonitorRef.current?.getChangeCount(key) ?? 0;
  }, []);

  const getLastModified = useCallback((key: string): string | null => {
    return registryMonitorRef.current?.getLastModified(key) ?? null;
  }, []);

  useEffect(() => {
    if (!isInitializedRef.current && !registryMonitorRef.current) {
      // console.log('[useRegistryMonitor] Initializing RegistryMonitor');
      registryMonitorRef.current = new RegistryMonitor(updateState);
      isInitializedRef.current = true;
    }

    return () => {
      // console.log('[useRegistryMonitor] Cleaning up RegistryMonitor');
      if (registryMonitorRef.current) {
        registryMonitorRef.current.dispose();
      }
      registryMonitorRef.current = null;
      isInitializedRef.current = false;
    };
  }, [updateState]);

  const registryTableData = useMemo(() => 
    convertRegistryEventsToTableData(events, getChangeCount), 
    [events, getChangeCount]
  );

  const startMonitoring = useCallback(async (): Promise<void> => {
    if (registryMonitorRef.current) {
      await registryMonitorRef.current.startMonitoring();
    }
  }, []);

  const stopMonitoring = useCallback(async (): Promise<void> => {
    if (registryMonitorRef.current) {
      await registryMonitorRef.current.stopMonitoring();
    }
  }, []);

  const clearStorage = useCallback(async (): Promise<void> => {
    // console.log('[useRegistryMonitor] clearStorage called');
    if (registryMonitorRef.current) {
      await registryMonitorRef.current.clearStorage();
    }
  }, []);

  return {
    isMonitoring,
    events,
    registryTableData,
    startMonitoring,
    stopMonitoring,
    getChangeCount,
    getLastModified,
    clearStorage,
  };
};

export default useRegistryMonitor;