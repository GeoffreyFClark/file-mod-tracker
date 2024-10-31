import React, { useState } from 'react';
import { useFileMonitorContext } from '../contexts/FileMonitorContext';
import { useRegistryMonitorContext } from '../contexts/RegistryMonitorContext';
import MUITable from '../components/MUITable';
import RegistryMUITable from '../components/RegistryMUITable';
import { Tabs, Tab, Box } from '@mui/material';
import { FolderOpen, ListAlt } from '@mui/icons-material';

const Logs: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const { tableData: fileTableData } = useFileMonitorContext();
  const { registryTableData } = useRegistryMonitorContext();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <div className='flex flex-col gap-2'>
      <Box sx={{ borderBottom: 1, 
        borderColor: 'divider',
        padding: 0, }}
        className="bg-white rounded overflow-hidden m-4"
        >
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          aria-label="monitor tabs"
          variant="fullWidth"
        >
          <Tab 
            icon={<FolderOpen />} 
            label="File System" 
            iconPosition="start"
          />
          <Tab 
            icon={<ListAlt />} 
            label="Registry" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <div className='p-4'>
        {currentTab === 0 && (
          <div className='transition-opacity duration-200 ease-in-out'>
            <MUITable data={fileTableData} />
          </div>
        )}
        {currentTab === 1 && (
          <div className='transition-opacity duration-200 ease-in-out'>
            <RegistryMUITable data={registryTableData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Logs);