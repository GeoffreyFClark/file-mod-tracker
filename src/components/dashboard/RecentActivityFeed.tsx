import React, { useMemo } from 'react';
import { useFileMonitorContext } from '../../contexts/FileMonitorContext';
import { useRegistryMonitorContext } from '../../contexts/RegistryMonitorContext';

interface ActivityItem {
  type: 'file' | 'registry';
  path: string;
  action: string;
  timestamp: string;
  details?: string;
}

interface RecentActivityFeedProps {
  mode: 'file' | 'registry';
}

const getActionColor = (action: string): string => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create') || actionLower.includes('added')) return 'text-green-500';
  if (actionLower.includes('delete') || actionLower.includes('removed')) return 'text-red-500';
  if (actionLower.includes('modif') || actionLower.includes('updated')) return 'text-yellow-500';
  if (actionLower.includes('rename')) return 'text-blue-500';
  if (actionLower.includes('write')) return 'text-cyan-500';
  if (actionLower.includes('unchanged')) return 'text-gray-500';
  if (actionLower.includes('subkey')) return 'text-purple-500';
  return 'text-gray-400';
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return timestamp;
  }
};

const truncatePath = (path: string, maxLength: number = 60): string => {
  if (path.length <= maxLength) return path;
  const parts = path.split(/[\\\/]/);
  if (parts.length <= 3) return '...' + path.slice(-maxLength);
  return parts[0] + '\\...\\' + parts.slice(-2).join('\\');
};

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ mode }) => {
  const { tableData } = useFileMonitorContext();
  const { registryEvents } = useRegistryMonitorContext();

  const activities = useMemo((): ActivityItem[] => {
    if (mode === 'file') {
      const fileActivities: ActivityItem[] = [];
      tableData.forEach(watcher => {
        watcher.files.forEach(file => {
          file.entries.forEach(entry => {
            fileActivities.push({
              type: 'file',
              path: entry.Path,
              action: entry.Type,
              timestamp: entry.Timestamp,
              details: entry.process_name || `PID: ${entry.PID}`,
            });
          });
        });
      });
      return fileActivities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 50);
    } else {
      return registryEvents
        .map(event => ({
          type: 'registry' as const,
          path: event.key,
          action: event.type,
          timestamp: event.timestamp,
          details: event.value || undefined,
        }))
        .sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 50);
    }
  }, [mode, tableData, registryEvents]);

  if (activities.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <h3 className="text-md font-semibold mb-3">Recent Activity</h3>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No {mode === 'file' ? 'file' : 'registry'} activity recorded yet
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-md font-semibold mb-3">Recent Activity</h3>
      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {activities.map((activity, index) => (
          <div
            key={`${activity.timestamp}-${index}`}
            className="bg-secondary rounded p-2 text-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-medium ${getActionColor(activity.action)}`}>
                {activity.action}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>
            <div className="text-xs text-gray-400 break-all" title={activity.path}>
              {truncatePath(activity.path)}
            </div>
            {activity.details && (
              <div className="text-xs text-gray-500 mt-1">
                {activity.details}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityFeed;
