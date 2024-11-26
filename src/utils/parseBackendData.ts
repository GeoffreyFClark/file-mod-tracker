// src/utils/parseBackendData.ts
export interface DataRow {
  changes?: number; // Make changes optional
  Path: string;
  PID: string;
  Type: string;
  Size: string;
  Timestamp: string;
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
        Path: path,
        PID: file.PID || '',
        Type: file.Type || '',
        Size: file.Size || '',
        Timestamp: latestTimestamp,
      };

      if (!existingDataRow) {
        dataRowsMap.set(path, dataRow);
      } else {
        // Update existing row with new changes count and most recent timestamp
        existingDataRow.changes = (existingDataRow.changes || 0) + file.entries.length;
        if (new Date(latestTimestamp) > new Date(existingDataRow.Timestamp)) {
          existingDataRow.Timestamp = latestTimestamp;
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
          Path: entry.Path,
          PID: entry.PID,
          Type: entry.Type,
          IRPOperation: entry.IRPOperation,
          Timestamp: entry.Timestamp,
          Size: entry.Size,
          GID: entry.GID,
          Metadata: entry.Metadata,
          process_name: entry.process_name,
          process_path: entry.process_path
        };
        dataRows.push(dataRow);
      });
    });
  });

  return dataRows;
}

