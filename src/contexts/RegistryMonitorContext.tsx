// RegistryMonitorContext.tsx
import React, { createContext, useMemo, useContext } from 'react';
import useRegistryMonitor from '../hooks/useRegistryMonitor';
import { RegistryEvent } from '../hooks/registry-monitor';
import { RegistryTableDataRow } from '../utils/types';

// RegistryMonitorContext.tsx
interface RegistryMonitorContextType {
  isMonitoring: boolean;
  registryEvents: RegistryEvent[];
  registryTableData: RegistryTableDataRow[];
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  getChangeCount: (key: string) => number;
  getLastModified: (key: string) => string | null;
  clearStorage: () => void;
}

const RegistryMonitorContext = createContext<RegistryMonitorContextType | undefined>(undefined);

export const RegistryMonitorProvider: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const registryMonitor = useRegistryMonitor();

  const contextValue = useMemo(() => ({
    isMonitoring: registryMonitor.isMonitoring,
    registryEvents: registryMonitor.events,
    registryTableData: registryMonitor.registryTableData,
    startMonitoring: registryMonitor.startMonitoring,
    stopMonitoring: registryMonitor.stopMonitoring,
    getChangeCount: registryMonitor.getChangeCount,
    getLastModified: registryMonitor.getLastModified,
    clearStorage: registryMonitor.clearStorage,
  }), [
    registryMonitor.isMonitoring, 
    registryMonitor.events,
    registryMonitor.registryTableData,
    registryMonitor.getChangeCount,
    registryMonitor.getLastModified,
    registryMonitor.clearStorage
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