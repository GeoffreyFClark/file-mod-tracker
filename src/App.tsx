
import React, { useMemo, useEffect } from 'react';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { FileMonitorProvider, useFileMonitorContext } from './contexts/FileMonitorContext';
import Tabs from './components/Tabs';

import { useState } from 'react';


// Import Heroicons
import { 
  HomeIcon, 
  DocumentTextIcon, 
  BookmarkIcon, 
  EyeIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline'; // Use '/solid' for solid icons

import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Saved from './pages/Saved';
import Detections from './pages/Detections';
import Settings from './pages/Settings';


// This component only listens for data changes
const DataListener: React.FC = () => {
  const { tableData, directories } = useFileMonitorContext();

  useEffect(() => {
    console.log('FileMonitor tableData updated:', tableData);
  }, [tableData]);

  useEffect(() => {
    console.log('FileMonitor directories updated:', directories);
  }, [directories]);

  return null; // This component doesn't render anything
};

// This component handles the rendering of content
const ContentRenderer: React.FC<{ selectedItem: string }> = React.memo(({ selectedItem }) => {
  console.log('ContentRenderer rendering, selectedItem:', selectedItem);

  const memoizedContent = useMemo(() => ({
    Dashboard: <Dashboard />,
    Logs: <Logs />,
    Saved: <Saved />,
    Detections: <Detections />,
    Settings: <Settings />,
  }), []);

  const content = memoizedContent[selectedItem as keyof typeof memoizedContent] || memoizedContent.Dashboard;

  return <div className="px-6 py-6 transition-all duration-300 ease-in-out">{content}</div>;
});

ContentRenderer.displayName = 'ContentRenderer';

function AppContent() {
  const { selectedItem, setSelectedItem } = useNavigation();

  console.log('AppContent rendering');

  // Define the tabs based on your application's navigation items
  const tabs = useMemo(() => [
    { name: 'Dashboard', current: selectedItem === 'Dashboard', icon: HomeIcon },
    { name: 'Logs', current: selectedItem === 'Logs', icon: DocumentTextIcon },
    { name: 'Saved', current: selectedItem === 'Saved', icon: BookmarkIcon },
    { name: 'Detections', current: selectedItem === 'Detections', icon: EyeIcon },
    { name: 'Settings', current: selectedItem === 'Settings', icon: Cog6ToothIcon },
  ], [selectedItem]);

function App() {
  const [selectedItem, setSelectedItem] = useState('Dashboard');

  // Conditionally render content based on the selected sidebar item
  const renderContent = () => {
    switch (selectedItem) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Directories':
        return <Directories />;
      case 'Logs':
        return <Logs />;
      case 'Saved':
        return <Saved />;
      case 'Detections':
        return <Detections />;
      case 'Settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };


  return (
    <FileMonitorProvider>
      <DataListener />
      <div className="flex flex-col min-h-screen">
        {/* Tabs Component */}
        <div className="sticky top-0 bg-white z-50 shadow">
          <Tabs tabs={tabs} onTabChange={setSelectedItem} />
        </div>
        
        {/* Content Area */}
        <div className="flex-grow container mx-auto mt-4 px-4">
          <ContentRenderer selectedItem={selectedItem} />
        </div>
      </div>
    </FileMonitorProvider>
  );
}

function App() {
  console.log('App component rendering');

  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}

export default App;
