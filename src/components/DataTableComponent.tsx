import React, { useEffect, useRef, useMemo } from 'react';
import { DataTable } from 'simple-datatables';
import { DataRow, Data } from '../utils/types';

interface DataTableComponentProps {
  parsedData: DataRow[];
  rawData?: any[];
}

const initialData: Data = {
  headings: [
    { data: 'Path' },
    { data: 'PID.' },
    { data: 'Type' },
    { data: 'Timestamp' },
    { data: 'Changes' },
  ],
  data: [
    {
      cells: [
        { data: 'C:/' },
        { data: '*' },
        { data: '*' },
        { data: '*' },
        { data: '0' },
      ],
    },
  ],
};

const DataTableComponent: React.FC<DataTableComponentProps> = ({ parsedData, rawData }) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const datatableRef = useRef<DataTable | null>(null);
  const tableID = useMemo(() => 'Main', []);

  useEffect(() => {
    if (tableRef.current) {
      const options = {
        perPageSelect: [10, 100, 1000, 10000, ['All', -1]],
        perPage: 10,
        type: 'string',
        columns: [
          {
            select: 1,
            type: 'number',
          },
          {
            select: 3,
            type: 'date',
            format: 'YYYY/DD/MM',
            sort: 'desc',
          },
        ],
        data: initialData,
      } as any;

      datatableRef.current = new DataTable(tableRef.current, options);
    }

    return () => {
      datatableRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (datatableRef.current && parsedData.length > 0) {
      console.log('Updating DataTable with new rows:', parsedData);
      datatableRef.current.data.data = parsedData;
      datatableRef.current.update();
    }
  }, [parsedData]);

  return (
    <div>
      <table id="demo-table" ref={tableRef} className="data-table" style={{ width: '100%', marginTop: '20px' }}>
        {/* The DataTable will populate the table */}
      </table>
    </div>
  );
};

export default React.memo(DataTableComponent);