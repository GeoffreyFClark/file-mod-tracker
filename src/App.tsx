import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

/* Breadcrumb Context */
import { BreadcrumbProvider } from './components/BreadcrumbContext';
import Breadcrumbs from './components/Breadcrumbs';

/* Navigation Context */
import { NavigationProvider } from './components/NavigationContext';

/* Sidebar & Layout */
import Sidebar from './components/Sidebar';

/* Page Imports */
import Dashboard from './pages/Dashboard';
import Directories from './pages/Directories';
import Logs from './pages/Logs';
import Saved from './pages/Saved';
import Detections from './pages/Detections';
import Settings from './pages/Settings';

function App() {
  const [selectedItem, setSelectedItem] = useState('Dashboard');
  const [directories, setDirectories] = useState<string[]>([]);
  const [fileChanges, setFileChanges] = useState<string[]>([]);

  // Set up the event listener for file changes
  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen('file-change-event', (event) => {
        setFileChanges((prev) => [...prev, event.payload as string]);
      });
  
      return () => unlisten();
    };
  
    setupListener();
  }, []);  

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
    <BreadcrumbProvider>
      <NavigationProvider setSelectedItem={setSelectedItem}>
        <div className="flex">
          {/* Sidebar Component */}
          <Sidebar selectedItem={selectedItem} />

          {/* Main content area */}
          <div className="flex-grow lg:pl-72">
            {/* Breadcrumbs bar */}
            <div className="sticky top-0 bg-gray-100">
              <Breadcrumbs />
            </div>

            {/* Page content below breadcrumbs */}
            <div className="px-6 py-6">
              {renderContent()} {/* This will load the component based on the selected sidebar item */}
            </div>
          </div>
        </div>
      </NavigationProvider>
    </BreadcrumbProvider>
  );
}

export default App;