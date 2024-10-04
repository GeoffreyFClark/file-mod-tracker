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
  
        const dataRow: DataRow = {
          changes: parseInt(file.Changes) || 0,
          path: path,
          pid: file.PID || '',
          type: file.Type || '',
          size: file.Size || '',
          timestamp: file.Timestamp || '',
        };
  
        if (!existingDataRow) {
          dataRowsMap.set(path, dataRow);
        } else {
          existingDataRow.changes = dataRow.changes;
          existingDataRow.timestamp = dataRow.timestamp;
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
  