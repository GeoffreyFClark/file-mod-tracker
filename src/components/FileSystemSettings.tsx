import React, { useState } from 'react';
import { useFileMonitorContext } from '../contexts/FileMonitorContext';
import DirectoryCard from '../components/DirectoryCard';
import { open } from '@tauri-apps/api/dialog';

const FileSystemSettings: React.FC = () => {
  const [directoryPath, setDirectoryPath] = useState<string>('');
  const {
    addDirectoryByPath,
    toggleDirectoryState,
    deleteDirectory,
    directories,
  } = useFileMonitorContext();

  const sortedDirectories = [...directories].sort((a, b) => {
    if (a.isEnabled === b.isEnabled) return 0;
    return a.isEnabled ? -1 : 1;
  });

  const handleAddDirectory = async () => {
    const trimmedPath = directoryPath.trim();
    if (trimmedPath) {
      await addDirectoryByPath(trimmedPath);
      setDirectoryPath('');
    }
  };

  const handleBrowseDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: directoryPath || undefined,
    });
    if (selected && typeof selected === 'string') {
      setDirectoryPath(selected);
    }
  };

  return (
    <div className="bg-app rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">File System Monitoring</h3>
      <div className="p-3">
        <div className="mb-6">
          <label
            htmlFor="directory"
            className="block text-sm font-medium leading-6 color-app mb-2"
          >
            Add Directory to Monitor
          </label>
          <form onSubmit={(e) => { e.preventDefault(); handleAddDirectory(); }}>
            <div className="flex">
              <input
                type="text"
                name="directory"
                id="directory"
                value={directoryPath}
                onChange={(e) => setDirectoryPath(e.target.value)}
                className="flex-1 block w-full rounded-md border color-outline bg-secondary color-app py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="C:\path\to\directory"
              />
              <button
                type="button"
                onClick={handleBrowseDirectory}
                className="ml-4 rounded-md bg-secondary color-outline px-3 py-2 text-sm font-semibold app-green shadow-sm app-button"
              >
                Browse
              </button>
              <button
                type="submit"
                className="ml-2 rounded-md bg-secondary color-outline px-3 py-2 text-sm font-semibold app-green shadow-sm app-button"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3">Monitored Directories</h4>
          {directories.length === 0 ? (
            <p className="text-gray-500">No directories added yet.</p>
          ) : (
            sortedDirectories.map((directory) => (
              <DirectoryCard
                key={directory.path}
                directory={{
                  path: directory.path,
                  isMonitored: directory.isEnabled,
                }}
                onAdd={() => toggleDirectoryState(directory.path)}
                onRemove={() => toggleDirectoryState(directory.path)}
                onDelete={() => deleteDirectory(directory.path)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FileSystemSettings