// src/utils/convertMonitorStateToTableData.ts
import { FileMonitorState } from '../hooks/monitor';
import { TableDataRow } from '../utils/types';

export const convertMonitorStateToTableData = (state: FileMonitorState): TableDataRow[] => {
  // console.log('convertMonitorStateToTableData - Input:', state); 

  const tableData: TableDataRow[] = [];

  Object.entries(state.fileChanges).forEach(([directory, files]) => {
    Object.entries(files).forEach(([filePath, count]) => {
      const details = state.fileDetails[directory]?.[filePath] || {};
      const entries = state.fileDetails[directory]?.[filePath]?.entries || [];

      tableData.push({
        Path: filePath,
        PID: details.PID || 'N/A',
        Type: details.Type || 'N/A',
        Timestamp: details.Timestamp || new Date().toISOString(),
        Changes: typeof count === 'number' ? count : 0, // Ensure Changes is a number
        entries,
      });
    });
  });

  // console.log('convertMonitorStateToTableData - Output:', tableData);

  return tableData;
};