import React, { useState } from 'react';
import { useFileMonitorContext } from '../contexts/FileMonitorContext';
import { useRegistryMonitorContext } from '../contexts/RegistryMonitorContext';
import MUITable from '../components/MUITable';
import RegistryMUITable from '../components/RegistryMUITable';
import { Tabs, Tab, Box } from '@mui/material';
import { DARK_TEXT_SELECTED, DARK_TEXT_UNSELECTED } from '../utils/constants';

const Logs: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const { tableData: fileTableData } = useFileMonitorContext();
  const { registryTableData } = useRegistryMonitorContext();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <>
    <h2 className="text-2xl font-semibold mb-6 app-green">Logs</h2>
    <div className='flex flex-col'>
      <Box 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          padding: 0,
          '& .MuiTabs-indicator': {
            backgroundColor: '#B6C4FF',
          },
          '& .MuiTab-root': {
            color: DARK_TEXT_UNSELECTED,
            '&.Mui-selected': {
              color: DARK_TEXT_SELECTED,
            }
          }
        }}
        className="overflow-hidden mb-6 border-tabs"
      >
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          aria-label="monitor tabs"
        >
          <Tab 
            label="File System" 
          />
          <Tab 
            label="Registry" 
          />
          <Tab 
            label="Import" 
          />
        </Tabs>
      </Box>

      <div>
        {currentTab === 0 && (
          <div className='transition-opacity duration-200 ease-in-out'>
            <MUITable data={fileTableData} darkMode={true}/>
          </div>
        )}
        {currentTab === 1 && (
          <div className='transition-opacity duration-200 ease-in-out'>
            <RegistryMUITable data={registryTableData} />
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default React.memo(Logs);