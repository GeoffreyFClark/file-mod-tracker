import React, { useMemo, useEffect } from 'react';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { FileMonitorProvider, useFileMonitorContext } from './contexts/FileMonitorContext';
import { RegistryMonitorProvider, useRegistryMonitorContext } from './contexts/RegistryMonitorContext';
import Tabs from './components/Tabs';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  BookmarkIcon, 
  EyeIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Saved from './pages/Saved';
import Detections from './pages/Detections';
import Settings from './pages/Settings';

const ClearStorageOnMount: React.FC = () => {
  const { clearStorage } = useRegistryMonitorContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[ClearStorageOnMount] Clearing registry storage on app launch');
      clearStorage();
    }, 0);

    return () => clearTimeout(timer);
  }, [clearStorage]);

  return null;
};

const DataListener: React.FC = () => {
  const { tableData, directories } = useFileMonitorContext();

  // File monitoring logs
  useEffect(() => {
    console.log('FileMonitor tableData updated:', tableData);
  }, [tableData]);

  useEffect(() => {
    console.log('FileMonitor directories updated:', directories);
  }, [directories]);

  return null;
};

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

  const tabs = useMemo(() => [
    { name: 'Dashboard', current: selectedItem === 'Dashboard', icon: HomeIcon },
    { name: 'Logs', current: selectedItem === 'Logs', icon: DocumentTextIcon },
    { name: 'Saved', current: selectedItem === 'Saved', icon: BookmarkIcon },
    { name: 'Detections', current: selectedItem === 'Detections', icon: EyeIcon },
    { name: 'Settings', current: selectedItem === 'Settings', icon: Cog6ToothIcon },
  ], [selectedItem]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 bg-white z-50 shadow">
        <Tabs tabs={tabs} onTabChange={setSelectedItem} />
      </div>
      <div className="flex-grow container mx-auto mt-4 px-4">
        <ContentRenderer selectedItem={selectedItem} />
      </div>
    </div>
  );
}

function App() {
  console.log('App component rendering');

  return (
    <NavigationProvider>
      <RegistryMonitorProvider>
        <FileMonitorProvider>
          <ClearStorageOnMount />
          <DataListener />
          <AppContent />
        </FileMonitorProvider>
      </RegistryMonitorProvider>
    </NavigationProvider>
  );
}

export default App;