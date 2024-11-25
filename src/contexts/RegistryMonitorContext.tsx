import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';
import { RegistryTableDataRow, RegistryEvent, RegistryMonitorContextType, RegistryCache } from '../utils/types';
import { registryLogger } from '../utils/Logger';

const REGISTRY_EVENTS_KEY = 'registryEvents';

const RegistryMonitorContext = createContext<RegistryMonitorContextType | undefined>(undefined);

const normalizeKey = (key: string): string => {
  return key.replace(' was changed.', '').trim();
};

const useRegistryMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [events, setEvents] = useState<RegistryEvent[]>([]);
  const [cache, setCache] = useState<RegistryCache>({});
  const [monitoredKeys, setMonitoredKeys] = useState<string[]>([]);
  const [registryTableData, setRegistryTableData] = useState<RegistryTableDataRow[]>([]);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | undefined>();

  // Effect to update cache and table data when events change
  useEffect(() => {
    // Update cache
    const newCache: RegistryCache = {};
    events.forEach(event => {
      const normalizedKey = normalizeKey(event.key);
      if (!newCache[normalizedKey]) {
        newCache[normalizedKey] = {
          changeCount: 0,
          lastModified: event.timestamp
        };
      }
      newCache[normalizedKey].changeCount++;
      newCache[normalizedKey].lastModified = event.timestamp;
    });
    setCache(newCache);

    // Group events by key
    const eventsByKey = events.reduce((acc, event) => {
      const key = event.key;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        Type: event.type,
        Value: event.value,
        PreviousData: event.previousData || '',
        NewData: event.newData || '',
        Timestamp: event.timestamp
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Convert grouped events to table data
    const tableData = Object.entries(eventsByKey).map(([key, entries]) => ({
      Key: key,
      entries: entries,
      Changes: newCache[normalizeKey(key)]?.changeCount || 0
    }));

    setRegistryTableData(tableData);
  }, [events]);

  // Effect to handle logging whenever table data changes
  useEffect(() => {
    if (registryTableData.length > 0) {
      registryLogger.logTableData(registryTableData).catch(error => {
        console.error('[RegistryMonitor] Error logging table data:', error);
      });
    }
  }, [registryTableData]);

  // Initialize from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem(REGISTRY_EVENTS_KEY);
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents);
        setEvents(parsedEvents);
      } catch (error) {
        console.error('[RegistryMonitor] Error parsing saved events:', error);
        localStorage.removeItem(REGISTRY_EVENTS_KEY);
      }
    }

    // Check initial monitoring status
    invoke<boolean>('is_registry_monitoring')
      .then(status => setIsMonitoring(status))
      .catch(error => console.error('[RegistryMonitor] Error checking monitoring status:', error));
  }, []);

  // Set up event listener
  useEffect(() => {
    let isSubscribed = true;  // Flag to track if we should process events

    const setupListener = async () => {
      try {
        const unsub = await listen('registry-change-event', (event) => {
          if (!isSubscribed) {
            return;
          }

          const eventData = event.payload as string;
          const lines = eventData.split('\n');
          const registryEvent: RegistryEvent = {
            type: 'UNKNOWN',
            key: '',
            value: '',
            timestamp: new Date().toISOString(),
          };

          lines.forEach(line => {
            if (line.startsWith('UPDATED:') || line.startsWith('ADDED:') || line.startsWith('REMOVED:')) {
              const [type, content] = line.split(': ');
              registryEvent.type = type.trim();
              
              const valueMatch = content.match(/Value '([^']+)' in registry key '([^']+)'/);
              if (valueMatch) {
                registryEvent.value = valueMatch[1];
                registryEvent.key = valueMatch[2];
              }
            } else if (line.startsWith('Previous Data:')) {
              registryEvent.previousData = line.split(':')[1].trim().replace(/'/g, '');
            } else if (line.startsWith('New Data:')) {
              registryEvent.newData = line.split(':')[1].trim().replace(/'/g, '');
            }
          });

          // Only add valid events
          if (registryEvent.key && registryEvent.type !== 'UNKNOWN') {
            setEvents(prevEvents => {
              const newEvents = [...prevEvents, registryEvent];
              localStorage.setItem(REGISTRY_EVENTS_KEY, JSON.stringify(newEvents));
              return newEvents;
            });
          }
        });
        
        setUnsubscribe(() => unsub);
      } catch (error) {
        console.error('[RegistryMonitor] Error setting up event listener:', error);
      }
    };

    setupListener();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        unsubscribe();
      }
      // Force final write of any pending registry data
      if (registryTableData.length > 0) {
        registryLogger.forceWrite().catch(error => {
          console.error('[RegistryMonitor] Error writing final log:', error);
        });
      }
    };
  }, []);

  const clearStorage = useCallback(() => {
    localStorage.removeItem(REGISTRY_EVENTS_KEY);
    setEvents([]);
  }, []);

  const startMonitoring = useCallback(async () => {
    try {
      await invoke('start_registry_monitoring');
      setIsMonitoring(true);
    } catch (error) {
      console.error('[RegistryMonitor] Error starting monitoring:', error);
      throw error;
    }
  }, []);

  const stopMonitoring = useCallback(async () => {
    try {
      await invoke('stop_registry_monitoring');
      setIsMonitoring(false);
    } catch (error) {
      console.error('[RegistryMonitor] Error stopping monitoring:', error);
      throw error;
    }
  }, []);

  const addRegistryKey = useCallback(async (keyPath: string) => {
    try {
      await invoke('add_registry_key_to_monitor', { keyPath });
      const keys = await invoke<string[]>('get_monitored_registry_keys');
      setMonitoredKeys(keys);
    } catch (error) {
      console.error('[RegistryMonitor] Error adding registry key:', error);
      throw error;
    }
  }, []);

  const removeRegistryKey = useCallback(async (keyPath: string) => {
    try {
      await invoke('remove_registry_key_from_monitor', { keyPath });
      const keys = await invoke<string[]>('get_monitored_registry_keys');
      setMonitoredKeys(keys);
    } catch (error) {
      console.error('[RegistryMonitor] Error removing registry key:', error);
      throw error;
    }
  }, []);

  const getChangeCount = useCallback((key: string) => {
    return cache[normalizeKey(key)]?.changeCount || 0;
  }, [cache]);

  const getLastModified = useCallback((key: string) => {
    return cache[normalizeKey(key)]?.lastModified || null;
  }, [cache]);

  return {
    isMonitoring,
    registryEvents: events,
    registryTableData,
    monitoredKeys,
    startMonitoring,
    stopMonitoring,
    getChangeCount,
    getLastModified,
    clearStorage,
    addRegistryKey,
    removeRegistryKey,
  };
};

export const RegistryMonitorProvider: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const registryMonitor = useRegistryMonitor();

  const contextValue = useMemo(() => registryMonitor, [
    registryMonitor.isMonitoring,
    registryMonitor.registryEvents,
    registryMonitor.registryTableData,
    registryMonitor.monitoredKeys,
  ]);

  return (
    <RegistryMonitorContext.Provider value={contextValue}>
      {children}
    </RegistryMonitorContext.Provider>
  );
});

export const useRegistryMonitorContext = () => {
  const context = useContext(RegistryMonitorContext);
  if (context === undefined) {
    throw new Error('useRegistryMonitorContext must be used within a RegistryMonitorProvider');
  }
  return context;
};

export default RegistryMonitorContext;