import React, { useState } from 'react';
import { useRegistryMonitorContext } from '../contexts/RegistryMonitorContext';
import RegistryCard from '../components/RegistryCard';
import useLocalStorage from '../hooks/useLocalStorage';
import { invoke } from '@tauri-apps/api/tauri';

// Preset registry keys for common security monitoring
const PRESET_KEYS = {
  STARTUP_PROGRAMS: [
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run',
  ],
  SERVICES: [
    'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services',
  ],
  INSTALLED_SOFTWARE: [
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  ],
};

interface RegistryContentProps {
  storedRegistryKeys: string[];
  setStoredRegistryKeys: React.Dispatch<React.SetStateAction<string[]>>;
}

const RegistrySettings: React.FC<RegistryContentProps> = () => {
  const [registryKeyPath, setRegistryKeyPath] = useState<string>('');
  const [addKeyError, setAddKeyError] = useState<string>('');
  const [storedRegistryKeys, setStoredRegistryKeys] = useLocalStorage<string[]>('storedRegistryKeys', []);
  
  const {
    addRegistryKey,
    removeRegistryKey,
    monitoredKeys,
  } = useRegistryMonitorContext();

  const sortedRegistryKeys = [...storedRegistryKeys].sort((a, b) => {
    const aIsMonitored = monitoredKeys.includes(a);
    const bIsMonitored = monitoredKeys.includes(b);
    if (aIsMonitored === bIsMonitored) return 0;
    return aIsMonitored ? -1 : 1;
  });

  const handleAddRegistryKey = async () => {
    const trimmedKey = registryKeyPath.trim();
    setAddKeyError('');

    if (!trimmedKey) {
      setAddKeyError('Please enter a registry key path');
      return;
    }

    try {
      await addRegistryKey(trimmedKey);
      setStoredRegistryKeys([...storedRegistryKeys, trimmedKey]);
      setRegistryKeyPath('');
    } catch (error) {
      setAddKeyError(error instanceof Error ? error.message : 'Failed to add registry key');
      console.error('Failed to add registry key:', error);
    }
  };

  const handleToggleRegistryKey = async (keyPath: string, isCurrentlyMonitored: boolean) => {
    try {
      if (isCurrentlyMonitored) {
        await removeRegistryKey(keyPath);
      } else {
        await addRegistryKey(keyPath);
      }
    } catch (error) {
      console.error('Failed to toggle registry key:', error);
    }
  };

  const handleRegistryKeyRemove = async (keyPath: string) => {
    try {
      if (monitoredKeys.includes(keyPath)) {
        await removeRegistryKey(keyPath);
      }
      setStoredRegistryKeys(storedRegistryKeys.filter(key => key !== keyPath));
    } catch (error) {
      console.error('Failed to remove registry key:', error);
    }
  };

  const handleBrowseRegistry = async () => {
    try {
      await invoke('open_registry_editor');
    } catch (error) {
      console.error('Failed to open Registry Editor:', error);
      setAddKeyError('Failed to open Registry Editor');
    }
  };

  const handleAddPresetKeys = async (keys: string[]) => {
    let addedCount = 0;
    let failedCount = 0;
    const successfullyAddedKeys: string[] = [];

    for (const keyPath of keys) {
      // Skip if already in stored keys
      if (storedRegistryKeys.includes(keyPath)) {
        console.log(`Key already exists: ${keyPath}`);
        continue;
      }

      try {
        await addRegistryKey(keyPath);
        successfullyAddedKeys.push(keyPath);
        addedCount++;
      } catch (error) {
        console.error(`Failed to add preset key '${keyPath}':`, error);
        failedCount++;
      }
    }

    // Update stored keys once at the end with all successfully added keys
    if (successfullyAddedKeys.length > 0) {
      setStoredRegistryKeys([...storedRegistryKeys, ...successfullyAddedKeys]);
    }

    if (failedCount > 0) {
      setAddKeyError(`Added ${addedCount} keys, failed to add ${failedCount} keys`);
    } else if (addedCount > 0) {
      setAddKeyError(`Successfully added ${addedCount} preset keys`);
      setTimeout(() => setAddKeyError(''), 3000); // Clear message after 3 seconds
    }
  };

  return (
    <div className="bg-app rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Registry Monitoring</h3>
      <div className="p-3">
        <div className="mb-6">
          <label
            htmlFor="registry"
            className="block text-sm font-medium leading-6 color-app mb-2"
          >
            Add Registry Key to Monitor
          </label>
          <form onSubmit={(e) => { e.preventDefault(); handleAddRegistryKey(); }}>
            <div className="flex">
            <input
              type="text"
              name="registry"
              id="registry"
              value={registryKeyPath}
              onChange={(e) => {
                const input = e.target.value;
                const sanitizedInput = input.replace(/^Computer\\/, ''); // Removes "Computer\" if it appears at the beginning
                setRegistryKeyPath(sanitizedInput);
              }}
              className="flex-1 block w-full rounded-md border color-outline bg-secondary color-app py-1.5 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
            />

              <button
                type="button"
                onClick={handleBrowseRegistry}
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
          {addKeyError && (
            <p className="mt-2 text-sm text-red-500">{addKeyError}</p>
          )}
        </div>

        {/* Preset Keys Section */}
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3">Quick Add Preset Keys</h4>
          <p className="text-sm color-app mb-3">
            Add commonly monitored registry locations for security monitoring
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAddPresetKeys(PRESET_KEYS.STARTUP_PROGRAMS)}
              className="rounded-md bg-secondary color-outline px-4 py-2 text-sm font-semibold app-green shadow-sm app-button"
            >
              Startup Programs ({PRESET_KEYS.STARTUP_PROGRAMS.length})
            </button>
            <button
              onClick={() => handleAddPresetKeys(PRESET_KEYS.SERVICES)}
              className="rounded-md bg-secondary color-outline px-4 py-2 text-sm font-semibold app-green shadow-sm app-button"
            >
              Windows Services ({PRESET_KEYS.SERVICES.length})
            </button>
            <button
              onClick={() => handleAddPresetKeys(PRESET_KEYS.INSTALLED_SOFTWARE)}
              className="rounded-md bg-secondary color-outline px-4 py-2 text-sm font-semibold app-green shadow-sm app-button"
            >
              Installed Software ({PRESET_KEYS.INSTALLED_SOFTWARE.length})
            </button>
            <button
              onClick={() => handleAddPresetKeys([
                ...PRESET_KEYS.STARTUP_PROGRAMS,
                ...PRESET_KEYS.SERVICES,
                ...PRESET_KEYS.INSTALLED_SOFTWARE,
              ])}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Add All Security Keys
            </button>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3">Monitored Registry Keys</h4>
          {sortedRegistryKeys.length === 0 ? (
            <p className="text-gray-500">No registry keys added yet.</p>
          ) : (
            sortedRegistryKeys.map((keyPath) => (
              <RegistryCard
                key={keyPath}
                keyPath={keyPath}
                isMonitored={monitoredKeys.includes(keyPath)}
                onToggle={() => handleToggleRegistryKey(keyPath, monitoredKeys.includes(keyPath))}
                onRemove={() => handleRegistryKeyRemove(keyPath)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrySettings