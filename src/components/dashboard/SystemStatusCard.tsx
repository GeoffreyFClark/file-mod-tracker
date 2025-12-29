import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useFileMonitorContext } from '../../contexts/FileMonitorContext';
import { useRegistryMonitorContext } from '../../contexts/RegistryMonitorContext';

interface StatusItem {
  label: string;
  status: 'active' | 'inactive' | 'loading' | 'paused';
  detail?: string;
  hasToggle?: boolean;
  onToggle?: () => void;
  isToggling?: boolean;
}

const SystemStatusCard: React.FC = () => {
  const { directories, reinitializeMonitoring } = useFileMonitorContext();
  const { isMonitoring: isRegistryMonitoring, monitoredKeys } = useRegistryMonitorContext();

  const [isDriverLoaded, setIsDriverLoaded] = useState<boolean | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const checkDriverStatus = useCallback(async () => {
    try {
      const loaded = await invoke<boolean>('is_driver_loaded');
      console.log('Driver status check result:', loaded);
      setIsDriverLoaded(loaded);
    } catch (error) {
      console.error('Failed to check driver status:', error);
      setIsDriverLoaded(false);
    }
  }, []);

  useEffect(() => {
    checkDriverStatus();
    const interval = setInterval(checkDriverStatus, 5000);
    return () => clearInterval(interval);
  }, [checkDriverStatus]);

  const handleDriverToggle = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      if (isDriverLoaded) {
        console.log('Attempting to unload driver...');
        await invoke('unload_driver');
        console.log('Driver unload command completed');
      } else {
        console.log('Attempting to load driver...');
        await invoke('load_driver');
        console.log('Driver load command completed');
        // Reinitialize file monitoring after driver loads
        console.log('Reinitializing file monitoring...');
        await reinitializeMonitoring();
        console.log('File monitoring reinitialized');
      }
      await checkDriverStatus();
    } catch (error) {
      console.error('Failed to toggle driver:', error);
      // Still refresh status to show actual state
      await checkDriverStatus();
    } finally {
      setIsToggling(false);
    }
  };

  const enabledDirectories = directories.filter(d => d.isEnabled).length;

  // Determine file monitoring status based on driver state
  const getFileMonitoringStatus = (): StatusItem['status'] => {
    if (!isDriverLoaded) return 'paused';
    return enabledDirectories > 0 ? 'active' : 'inactive';
  };

  const getFileMonitoringDetail = (): string => {
    if (!isDriverLoaded) {
      return enabledDirectories > 0
        ? `Paused - ${enabledDirectories} ${enabledDirectories === 1 ? 'directory' : 'directories'} configured`
        : 'Paused - Driver not loaded';
    }
    return enabledDirectories > 0
      ? `Monitoring ${enabledDirectories} ${enabledDirectories === 1 ? 'directory' : 'directories'}`
      : 'No directories configured';
  };

  const statuses: StatusItem[] = [
    {
      label: 'Minifilter Driver',
      status: isDriverLoaded === null ? 'loading' : isDriverLoaded ? 'active' : 'inactive',
      detail: isDriverLoaded ? 'snFilter loaded' : 'Driver not loaded',
      hasToggle: true,
      onToggle: handleDriverToggle,
      isToggling,
    },
    {
      label: 'File Monitoring',
      status: getFileMonitoringStatus(),
      detail: getFileMonitoringDetail(),
    },
    {
      label: 'Registry Monitoring',
      status: isRegistryMonitoring && monitoredKeys.length > 0 ? 'active' : 'inactive',
      detail: monitoredKeys.length > 0
        ? `Monitoring ${monitoredKeys.length} ${monitoredKeys.length === 1 ? 'key' : 'keys'}`
        : 'No registry keys configured',
    },
  ];

  const getStatusColor = (status: StatusItem['status']): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'loading': return 'bg-yellow-500 animate-pulse';
      case 'paused': return 'bg-orange-500';
    }
  };

  const getStatusText = (status: StatusItem['status']): string => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'loading': return 'Checking...';
      case 'paused': return 'Paused';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-md font-semibold mb-3">System Status</h3>
      <div className="flex-1 flex flex-col justify-center space-y-4">
        {statuses.map(item => (
          <div key={item.label} className="bg-secondary rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex items-center gap-2">
                {item.hasToggle && (
                  <button
                    onClick={item.onToggle}
                    disabled={item.isToggling || item.status === 'loading'}
                    className={`
                      relative w-10 h-5 rounded-full transition-colors duration-200
                      ${item.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}
                      ${item.isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                    `}
                  >
                    <span
                      className={`
                        absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200
                        ${item.status === 'active' ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                )}
                {!item.hasToggle && (
                  <>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                    <span className="text-xs">{getStatusText(item.status)}</span>
                  </>
                )}
              </div>
            </div>
            {item.detail && (
              <div className="text-xs text-gray-500">{item.detail}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemStatusCard;
