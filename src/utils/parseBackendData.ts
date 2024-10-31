// src/utils/parseBackendData.ts
export interface DataRow {
  changes?: number; // Make changes optional
  path: string;
  pid: string;
  type: string;
  size: string;
  timestamp: string;
  [key: string]: string | number | undefined;
}

export function parseBackendDataUnique(backendData: any[]): DataRow[] {
  const dataRowsMap: Map<string, DataRow> = new Map();

  backendData.forEach((watcher) => {
    watcher.files.forEach((file: any) => {
      const path = file.Path || '';
      const existingDataRow = dataRowsMap.get(path);

      // Find the most recent timestamp from entries
      const latestTimestamp = file.entries.reduce((latest: string, entry: any) => {
        if (!latest || new Date(entry.Timestamp) > new Date(latest)) {
          return entry.Timestamp;
        }
        return latest;
      }, file.Timestamp || ''); // Use file.Timestamp as fallback

      const dataRow: DataRow = {
        changes: file.entries.length, // Use entries length for changes count
        path: path,
        pid: file.PID || '',
        type: file.Type || '',
        size: file.Size || '',
        timestamp: latestTimestamp,
      };

      if (!existingDataRow) {
        dataRowsMap.set(path, dataRow);
      } else {
        // Update existing row with new changes count and most recent timestamp
        existingDataRow.changes = (existingDataRow.changes || 0) + file.entries.length;
        if (new Date(latestTimestamp) > new Date(existingDataRow.timestamp)) {
          existingDataRow.timestamp = latestTimestamp;
        }
        dataRowsMap.set(path, existingDataRow);
      }
    });
  });

  return Array.from(dataRowsMap.values());
}

export function parseBackendDataAll(backendData: any[]): DataRow[] {
  const dataRows: DataRow[] = [];

  backendData.forEach((watcher) => {
    watcher.files.forEach((file: any) => {
      file.entries.forEach((entry: any) => {
        const dataRow: DataRow = {
          path: entry.Path || '',
          pid: entry.PID || '',
          type: entry.Type || '',
          size: entry.Size || '',
          timestamp: entry.Timestamp || '',
          // 'Changes' is not present in entries
        };
        dataRows.push(dataRow);
      });
    });
  });

  return dataRows;
}