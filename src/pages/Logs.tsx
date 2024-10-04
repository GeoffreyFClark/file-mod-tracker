
import React from 'react';
import { useFileMonitorContext } from '../contexts/FileMonitorContext';
import MUITable from '../components/MUITable';

import React from 'react';
import LogsTable from '../components/LogsTable';


const Logs: React.FC = () => {
  console.log('Logs component rendering');
  const { tableData } = useFileMonitorContext();

  return (

    <div className='flex flex-col gap-4 p-4'>
      <MUITable data={tableData} />

    <div className="flex flex-col gap-4 p-4">
      <LogsTable />

    </div>
  );
};

export default React.memo(Logs);
