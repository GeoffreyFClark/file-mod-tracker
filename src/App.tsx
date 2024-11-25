import React, { useMemo, useEffect } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { FileMonitorProvider, useFileMonitorContext } from './contexts/FileMonitorContext';
import { RegistryMonitorProvider, useRegistryMonitorContext } from './contexts/RegistryMonitorContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Detections from './pages/Detections';
import Settings from './pages/Settings';
import { appWindow } from '@tauri-apps/api/window';

const ClearStorageOnMount: React.FC = () => {
  const { clearStorage } = useRegistryMonitorContext();
  const { resetDirectoryStates } = useFileMonitorContext();
  const hasCleared = React.useRef(false);

  useEffect(() => {
    if (!hasCleared.current) {
      // console.log('[ClearStorageOnMount] Clearing registry storage on app launch');
      clearStorage();
      // console.log('[ClearStorageOnMount] Resetting directory states on app launch');
      resetDirectoryStates();
      hasCleared.current = true;
    }
  }, []);

  return null;
};


const ContentRenderer: React.FC<{ selectedItem: string }> = React.memo(({ selectedItem }) => {
  const memoizedContent = useMemo(() => ({
    Home: <Dashboard />,
    Logs: <Logs />,
    Detections: <Detections />,
    Settings: <Settings />,
    // Map other components as needed based on your sidebar icons
  }), []);

  const content = memoizedContent[selectedItem as keyof typeof memoizedContent] || memoizedContent.Home;

  return (
    <div className="p-6 pt-12 transition-all duration-300 ease-in-out">
      {content}
    </div>
  );
});

ContentRenderer.displayName = 'ContentRenderer';

function AppContent() {
  const { selectedItem } = useNavigation();

  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <div className="flex-1 overflow-auto hidden-scrollbar">
        <ContentRenderer selectedItem={selectedItem} />
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    appWindow.center();
  }, []);
  return (
    <SettingsProvider>
      <NavigationProvider>
        <RegistryMonitorProvider>
          <FileMonitorProvider>
            <ClearStorageOnMount />
            <AppContent />
          </FileMonitorProvider>
        </RegistryMonitorProvider>
      </NavigationProvider>
    </SettingsProvider>
  );
}

export default App;