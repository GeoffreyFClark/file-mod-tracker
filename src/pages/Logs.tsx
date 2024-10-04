// src/pages/Logs.tsx
import React from 'react';
import { useFileMonitorContext } from '../contexts/FileMonitorContext';
import MUITable from '../components/MUITable';

const Logs: React.FC = () => {
  console.log('Logs component rendering');
  const { tableData } = useFileMonitorContext();

  return (
    <div className='flex flex-col gap-4 p-4'>
      <MUITable data={tableData} />
    </div>
  );
};

export default React.memo(Logs);
