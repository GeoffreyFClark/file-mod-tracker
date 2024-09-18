import React from 'react';
import LogsTable from '../components/LogsTable';

const Logs: React.FC = () => {

  return (
    <div className="flex flex-col gap-4 p-4">
      <LogsTable />
    </div>
  );
};

export default Logs;
