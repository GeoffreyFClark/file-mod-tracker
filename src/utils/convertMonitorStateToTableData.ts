import { FileMonitorState } from '../hooks/monitor';
import { WatcherTableDataRow, ParentTableDataRow, FileChangeEntry, RegistryTableDataRow, RegistryChangeEntry, RegistryEvent } from '../utils/types';

export const convertMonitorStateToTableData = (state: FileMonitorState): WatcherTableDataRow[] => {
  const watcherDataMap: Record<string, ParentTableDataRow[]> = {};

  Object.entries(state.fileChanges).forEach(([directory, files]) => {
    Object.entries(files).forEach(([filePath, count]) => {
      const details = state.fileDetails[directory]?.[filePath] || {};
      const entries = state.fileDetails[directory]?.[filePath]?.entries || [];
      const watcher = details.Watcher || 'Unknown';

      if (!watcherDataMap[watcher]) {
        watcherDataMap[watcher] = [];
      }

      let parentEntry = watcherDataMap[watcher].find(entry => entry.Path === filePath);
      if (!parentEntry) {
        parentEntry = {
          Path: filePath,
          PID: '*',
          Type: '*',
          Timestamp: details.Timestamp || new Date().toISOString(),
          Changes: 0,
          Size: '*',  // Moved this line up
          entries: [],
        };
        watcherDataMap[watcher].push(parentEntry);
      }

      // Update the Changes count for the parent entry
      parentEntry.Changes += typeof count === 'number' ? count : 0;

      // Process and add child entries
      if (entries.length > 0) {
        // If detailed entries exist, add each as a child entry
        entries.forEach(entry => {
          const newEntry: FileChangeEntry = {
            Path: entry.Path,
            PID: entry.PID || 'N/A',
            Type: entry.Type || 'N/A',
            Timestamp: entry.Timestamp,
            Size: entry.Size || 'N/A',  // Changed this line
          };
          parentEntry!.entries.push(newEntry);
        });
      } else {
        // If no detailed entries, create a single child entry with available details
        const newEntry: FileChangeEntry = {
          Path: filePath,
          PID: details.PID || 'N/A',
          Type: details.Type || 'N/A',
          Timestamp: details.Timestamp || new Date().toISOString(),
          Size: details.Size || 'N/A',  // Changed this line
        };
        parentEntry.entries.push(newEntry);
      }
    });
  });

  // Convert the watcherDataMap into an array of WatcherTableDataRow
  return Object.entries(watcherDataMap).map(([watcher, files]) => ({
    Watcher: watcher,
    files: files,
  }));
};


export const convertRegistryEventsToTableData = (
  events: RegistryEvent[], 
  getChangeCount: (key: string) => number
): RegistryTableDataRow[] => {
  const registryDataMap: Record<string, RegistryTableDataRow> = {};

  events.forEach((event: RegistryEvent) => {
    const key = event.key.replace(' was changed.', '');
    
    if (!registryDataMap[key]) {
      registryDataMap[key] = {
        Key: key,
        entries: [],
        Changes: getChangeCount(key)
      };
    }

    const changeEntry: RegistryChangeEntry = {
      Type: event.type || "UNKNOWN",
      Value: event.value || "",
      PreviousData: event.previousData || "",
      NewData: event.newData || "",
      Timestamp: event.timestamp
    };

    registryDataMap[key].entries.push(changeEntry);
  });

  return Object.values(registryDataMap);
};