import React, { useRef, useCallback, useMemo } from 'react';
import { useFileMonitorContext } from '../contexts/FileMonitorContext';
import { DataRow } from '../utils/types';
import DataTableComponent from '../components/DataTableComponent';

const Logs: React.FC = () => {
  console.log('Logs component rendering');
  const { tableData } = useFileMonitorContext();
  const parsedDataRef = useRef<DataRow[]>([]);

  const parseData = useCallback((rawData: any[]): DataRow[] => {
    console.log('Parsing raw data:', rawData);
    if (!Array.isArray(rawData)) {
      console.warn('rawData is not an array:', rawData);
      return [];
    }
    return rawData.map(item => ({
      cells: [
        { data: item.Path },
        { data: item.entries?.length > 1 ? '*' : item.entries?.[0]?.PID, text: item.entries?.length > 1 ? '*' : String(item.entries?.[0]?.PID) },
        { data: item.entries?.length > 1 ? '*' : item.entries?.[0]?.Type },
        { data: item.entries?.[0]?.Timestamp },
        { data: String(item.Changes) },
      ],
    }));
  }, []);

  if (tableData && tableData.length > 0) {
    const newParsedData = parseData(tableData);
    console.log('New parsed data:', newParsedData);
    parsedDataRef.current = newParsedData;
  }

  const memoizedDataTableComponent = useMemo(() => (
    <DataTableComponent parsedData={parsedDataRef.current} rawData={tableData} />
  ), [tableData]);

  return (
    <div className='flex flex-col gap-4 p-4'>
      {memoizedDataTableComponent}
    </div>
  );
};

export default React.memo(Logs);