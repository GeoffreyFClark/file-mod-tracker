import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

function App() {
  const [directories, setDirectories] = useState<string[]>([]);
  const [fileChanges, setFileChanges] = useState<string[]>([]);  // currently using string for simplicity

  // Set up the event listener for file changes
  useEffect(() => {
    console.log("Setting up event listener");
    const setupListener = async () => {
      const unlisten = await listen('file-change-event', (event) => {
        console.log("Received file-change-event:", event.payload);
        setFileChanges((prev) => [...prev, event.payload as string]);
      });
  
      return () => {
        console.log("Cleaning up event listener");
        unlisten();
      };
    };
  
    setupListener();
  }, []);  

  // Call the start_monitoring tauri command with the selected directories
  const handleStartMonitoring = async () => {
    try {
      console.log("Invoking start_monitoring with directories:", directories);
      await invoke('start_monitoring', { directories });
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };

  // Add a new directory to the list
  const handleAddDirectory = () => {
    const dir = prompt('Enter directory path:');
    if (dir) {
      console.log("Adding directory:", dir);
      setDirectories([...directories, dir]);
    }
  };

  return (
    <div>
      <h1>Directory Monitor</h1>
      <button onClick={handleAddDirectory}>Add Directory</button>
      <button onClick={handleStartMonitoring}>Start Monitoring</button>

      <div>
        <h2>Monitored Directories:</h2>
        <ul>
          {directories.map((dir, index) => (
            <li key={index}>{dir}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2>File Changes:</h2>
        <ul>
          {fileChanges.map((change, index) => (
            <li key={index}>{change}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
