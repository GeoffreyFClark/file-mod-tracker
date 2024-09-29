import React, { useState } from 'react';
import { useFileMonitorContext } from '../contexts/FileMonitorContext';
import DirectoryCard from '../components/DirectoryCard';

const Settings: React.FC = () => {
  const [directoryPath, setDirectoryPath] = useState<string>('');
  const { addDirectoryByPath, removeDirectory, startMonitoring, directories } = useFileMonitorContext();

  const handleAddDirectory = async () => {
    const trimmedPath = directoryPath.trim();
    if (trimmedPath) { 
      await addDirectoryByPath(trimmedPath);
      setDirectoryPath('');
    }
  };

  const handleStartMonitoring = async () => {
    await startMonitoring();
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <div className="mb-4">
        <label htmlFor="directory" className="block text-sm font-medium leading-6 text-gray-900">
          Add Directory to Monitor
        </label>
        <div className="mt-2 flex">
          <input
            type="text"
            name="directory"
            id="directory"
            value={directoryPath}
            onChange={(e) => setDirectoryPath(e.target.value)}
            className="flex-1 block w-full rounded-md border border-gray-300 py-1.5 px-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="C:\path\to\directory"
          />
          <button
            type="button"
            onClick={handleAddDirectory}
            className="ml-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Monitored Directories</h3>
        {directories.length === 0 ? (
          <p className="text-gray-500">No directories added yet.</p>
        ) : (
          directories.map((directory) => (
            <DirectoryCard
              key={directory.path}
              directory={directory}
              onAdd={() => addDirectoryByPath(directory.path)}
              onRemove={() => removeDirectory(directory.path)}
            />
          ))
        )}
      </div>


    </div>
  );
};

export default Settings;