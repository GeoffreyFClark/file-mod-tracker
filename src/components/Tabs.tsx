import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { DARK_TEXT_SELECTED, DARK_TEXT_UNSELECTED } from '../utils/constants';

interface TabConfig {
  label: string;
  content: React.ReactNode;
}

interface TabbedPageLayoutProps {
  title: string;
  tabs: TabConfig[];
}

const TabbedPageLayout: React.FC<TabbedPageLayoutProps> = ({ title, tabs }) => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <h2 className="text-2xl font-semibold mb-6 app-green">{title}</h2>
      <div className="flex flex-col">
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
              },
            },
          }}
          className="overflow-hidden mb-6 border-tabs"
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="page tabs"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        <div>
          {tabs.map((tab, index) => (
            currentTab === index && (
              <div
                key={index}
                className="transition-opacity duration-200 ease-in-out"
              >
                {tab.content}
              </div>
            )
          ))}
        </div>
      </div>
    </>
  );
};

export default TabbedPageLayout;