import { useState } from 'react';

/* Breadcrumb Context */
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import Breadcrumbs from './components/Breadcrumbs';

/* Navigation Context */
import { NavigationProvider } from './contexts/NavigationContext';

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
            <div className="sticky top-0 bg-white">
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