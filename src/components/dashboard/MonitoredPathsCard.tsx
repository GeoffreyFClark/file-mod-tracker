import React from 'react';
import { useFileMonitorContext } from '../../contexts/FileMonitorContext';
import { useRegistryMonitorContext } from '../../contexts/RegistryMonitorContext';

interface MonitoredPathsCardProps {
  mode: 'file' | 'registry';
}

const truncatePath = (path: string, maxLength: number = 40): string => {
  if (path.length <= maxLength) return path;
  const parts = path.split(/[\\\/]/);
  if (parts.length <= 2) return '...' + path.slice(-maxLength);
  return parts[0] + '\\...\\' + parts.slice(-1).join('\\');
};

const MonitoredPathsCard: React.FC<MonitoredPathsCardProps> = ({ mode }) => {
  const { directories } = useFileMonitorContext();
  const { monitoredKeys } = useRegistryMonitorContext();

  const paths = mode === 'file' ? directories : monitoredKeys.map(key => ({ path: key, isEnabled: true }));
  const enabledCount = mode === 'file'
    ? directories.filter(d => d.isEnabled).length
    : monitoredKeys.length;

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-md font-semibold mb-3">
        Monitored {mode === 'file' ? 'Directories' : 'Registry Keys'}
      </h3>
      <div className="mb-2">
        <span className="text-2xl font-bold">{enabledCount}</span>
        <span className="text-sm text-gray-500 ml-2">
          {mode === 'file' ? `of ${directories.length} active` : 'keys'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-1">
        {paths.length === 0 ? (
          <div className="text-sm text-gray-500">
            No {mode === 'file' ? 'directories' : 'registry keys'} configured
          </div>
        ) : (
          paths.slice(0, 10).map((item, index) => {
            const path = typeof item === 'string' ? item : item.path;
            const isEnabled = typeof item === 'string' ? true : item.isEnabled;
            return (
              <div
                key={`${path}-${index}`}
                className={`text-xs p-1.5 rounded ${isEnabled ? 'bg-secondary' : 'bg-secondary opacity-50'}`}
                title={path}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="truncate">{truncatePath(path)}</span>
                </div>
              </div>
            );
          })
        )}
        {paths.length > 10 && (
          <div className="text-xs text-gray-500 text-center pt-1">
            +{paths.length - 10} more
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoredPathsCard;
