import React from 'react';
import { useFileMonitorContext } from '../../contexts/FileMonitorContext';
import { useRegistryMonitorContext } from '../../contexts/RegistryMonitorContext';

interface StatusItem {
  label: string;
  status: 'active' | 'inactive';
  detail?: string;
}

const SystemStatusCard: React.FC = () => {
  const { directories } = useFileMonitorContext();
  const { isMonitoring: isRegistryMonitoring, monitoredKeys } = useRegistryMonitorContext();

  const enabledDirectories = directories.filter(d => d.isEnabled).length;

  const statuses: StatusItem[] = [
    {
      label: 'File Monitoring',
      status: enabledDirectories > 0 ? 'active' : 'inactive',
      detail: enabledDirectories > 0
        ? `Monitoring ${enabledDirectories} ${enabledDirectories === 1 ? 'directory' : 'directories'}`
        : 'No directories configured',
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
    }
  };

  const getStatusText = (status: StatusItem['status']): string => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
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
                <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                <span className="text-xs">{getStatusText(item.status)}</span>
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
