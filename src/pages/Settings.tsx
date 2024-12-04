// Settings.tsx
import React, { useState } from 'react';
import TabbedPageLayout from '../components/Tabs';
import  FileSystemSettings from '../components/FileSystemSettings';
import  RegistrySettings  from '../components/RegistrySettings';
import GeneralSettings from '../components/GeneralSettings';

const Settings: React.FC = () => {
  // Keep the original localStorage initialization here
  const [storedRegistryKeys, setStoredRegistryKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('storedRegistryKeys');
    return saved ? JSON.parse(saved) : [];
  });

  // Still split the UI components for better organization
  const fileSystemContent = <FileSystemSettings />;
  const generalContent = <GeneralSettings/>;
  const registryContent = (
    <RegistrySettings
      storedRegistryKeys={storedRegistryKeys}
      setStoredRegistryKeys={setStoredRegistryKeys}
    />
  );

  return (
    <TabbedPageLayout
      title="Settings"
      tabs={[
        {
          label: "File System",
          content: fileSystemContent
        },
        {
          label: "Registry",
          content: registryContent
        },
        {
          label: "General",
          content: generalContent
        }
      ]}
    />
  );
};

export default Settings;