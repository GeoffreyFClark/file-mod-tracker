import React, { useMemo } from 'react';
import { useFileMonitorContext } from '../../contexts/FileMonitorContext';
import { useRegistryMonitorContext } from '../../contexts/RegistryMonitorContext';

interface StatItem {
  label: string;
  count: number;
  color: string;
}

interface ActivityStatsCardProps {
  mode: 'file' | 'registry';
}

const ActivityStatsCard: React.FC<ActivityStatsCardProps> = ({ mode }) => {
  const { tableData } = useFileMonitorContext();
  const { registryEvents } = useRegistryMonitorContext();

  const stats = useMemo((): StatItem[] => {
    if (mode === 'file') {
      const counts = { Created: 0, Modified: 0, Deleted: 0, Renamed: 0, Write: 0, Unchanged: 0 };

      tableData.forEach(watcher => {
        watcher.files.forEach(file => {
          file.entries.forEach(entry => {
            const type = entry.Type.toLowerCase();
            if (type.includes('create')) counts.Created++;
            else if (type.includes('modif')) counts.Modified++;
            else if (type.includes('delete')) counts.Deleted++;
            else if (type.includes('rename')) counts.Renamed++;
            else if (type.includes('write')) counts.Write++;
            else if (type.includes('unchanged')) counts.Unchanged++;
          });
        });
      });

      return [
        { label: 'Created', count: counts.Created, color: 'bg-green-500' },
        { label: 'Modified', count: counts.Modified, color: 'bg-yellow-500' },
        { label: 'Deleted', count: counts.Deleted, color: 'bg-red-500' },
        { label: 'Renamed', count: counts.Renamed, color: 'bg-blue-500' },
        { label: 'Write', count: counts.Write, color: 'bg-cyan-500' },
        { label: 'Unchanged', count: counts.Unchanged, color: 'bg-gray-500' },
      ];
    } else {
      const counts = { Added: 0, Updated: 0, Removed: 0, Subkeys: 0 };

      registryEvents.forEach(event => {
        const type = event.type.toUpperCase();
        if (type === 'ADDED') counts.Added++;
        else if (type === 'UPDATED') counts.Updated++;
        else if (type === 'REMOVED') counts.Removed++;
        else if (type.includes('SUBKEY')) counts.Subkeys++;
      });

      return [
        { label: 'Added', count: counts.Added, color: 'bg-green-500' },
        { label: 'Updated', count: counts.Updated, color: 'bg-yellow-500' },
        { label: 'Removed', count: counts.Removed, color: 'bg-red-500' },
        { label: 'Subkeys', count: counts.Subkeys, color: 'bg-purple-500' },
      ];
    }
  }, [mode, tableData, registryEvents]);

  const totalEvents = stats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-md font-semibold mb-3">Activity Stats</h3>
      <div className="flex-1 flex flex-col justify-center space-y-3">
        <div className="text-center mb-2">
          <span className="text-3xl font-bold">{totalEvents}</span>
          <p className="text-sm text-gray-500">Total Events</p>
        </div>
        {stats.map(stat => (
          <div key={stat.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stat.color}`} />
              <span className="text-sm">{stat.label}</span>
            </div>
            <span className="font-medium">{stat.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityStatsCard;
