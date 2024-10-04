import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

export interface FileChangeEntry {
  Path: string;
  PID: number | string;
  Type: string;
  Timestamp: string;
  OtherPath?: string;
  DisplayType: string;
  Metadata: Record<string, string>;
  Watcher: string; // Add this line
  Size: string;
}

export interface FileMonitorState {
  directories: string[];
  fileChanges: Record<string, Record<string, number>>;
  fileDetails: Record<string, Record<string, FileDetail>>;
}

interface FileDetail {
  PID: number | string;
  Type: string;
  DisplayType: string;
  Timestamp: string;
  entries: FileChangeEntry[];
  Metadata: Record<string, string>;
  Watcher: string; // Add this line
  Size: string;
}

function getBaseName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1];
}

export class FileMonitor {
  private state: FileMonitorState;
  private updateState: (state: FileMonitorState) => void;
  private isMonitoring: boolean = false;

  constructor(updateState: (state: FileMonitorState) => void) {
    this.state = {
      directories: [],
      fileChanges: {},
      fileDetails: {},
    };
    this.updateState = updateState;

    this.setupListener();
  }

  private setupListener() {
    listen('file-change-event', (event) => {
      const change = event.payload as string;
      const lines = change.split('\n');
      const [eventTypeAndPath, watcherLine, ...rest] = lines;
      const [eventType, filePath] = eventTypeAndPath.split(': ');
      
      const metadata: Record<string, string> = {};
      let watcher = 'Unknown';
      let size = 'N/A';
  
      if (watcherLine && watcherLine.startsWith('Watcher: ')) {
        watcher = watcherLine.split(': ')[1];
      }
  
      rest.forEach(line => {
        const [key, value] = line.split(': ');
        if (key && value) {
          if (key === 'Size') {
            size = value.trim();
          } else {
            metadata[key] = value.trim();
          }
        }
      });
  
      // Determine which directory this file belongs to
      const dir = this.state.directories.find((directory) => filePath.startsWith(directory));
      if (dir) {
        // Initialize structures if they don't exist
        const newFileChanges = { ...this.state.fileChanges };
        const newFileDetails = { ...this.state.fileDetails };
  
        if (!newFileChanges[dir]) {
          newFileChanges[dir] = {};
        }
        if (!newFileDetails[dir]) {
          newFileDetails[dir] = {};
        }
  
        const updateFileDetails = (path: string, type: string, displayType: string) => {
          if (!newFileDetails[dir][path]) {
            newFileDetails[dir][path] = {
              PID: metadata.PID || 'N/A',
              Type: type,
              DisplayType: displayType,
              Timestamp: metadata.Modified || new Date().toISOString(),
              entries: [],
              Metadata: metadata,
              Watcher: watcher,
              Size: size,  // Add this line
            };
          }
  
          const detail = newFileDetails[dir][path];
          detail.Type = type;
          detail.DisplayType = displayType;
          detail.Timestamp = metadata.Modified || detail.Timestamp;
          detail.Metadata = { ...detail.Metadata, ...metadata };
          detail.Watcher = watcher;
          detail.Size = size;  // Add this line
  
          const newEntry: FileChangeEntry = {
            Path: path,
            PID: detail.PID,
            Type: type,
            DisplayType: displayType,
            Timestamp: detail.Timestamp,
            Metadata: metadata,
            Watcher: watcher,
            Size: size,  // Add this line
          };
  
          detail.entries.push(newEntry);
  
          // Update fileChanges
          newFileChanges[dir][path] = (newFileChanges[dir][path] || 0) + 1;
        };

        
  
        updateFileDetails(filePath, eventType, eventType);
  
        // Create a new state object
        const newState: FileMonitorState = {
          ...this.state,
          fileChanges: newFileChanges,
          fileDetails: newFileDetails,
        };
  
        this.state = newState;
        this.updateState(this.state);
      }
    });
  }

  public async addDirectoryByPath(directory: string): Promise<void> {
    if (!this.state.directories.includes(directory)) {
      const newDirectories = [...this.state.directories, directory];
      const newState: FileMonitorState = {
        ...this.state,
        directories: newDirectories,
        fileChanges: { 
          ...this.state.fileChanges, 
          [directory]: this.state.fileChanges[directory] || {} 
        },
        fileDetails: { 
          ...this.state.fileDetails, 
          [directory]: this.state.fileDetails[directory] || {} 
        },
      };
      this.state = newState;
      this.updateState(this.state);
      console.log(`Directory added or re-added: ${directory}`);
  
      if (this.isMonitoring) {
        await this.updateMonitoringDirectories();
      }
    } else {
      console.log(`Directory already being monitored: ${directory}`);
    }
  }

  public async getWatchedDirectories(): Promise<string[]> {
    try {
      return await invoke('get_watched_directories') as string[];
    } catch (error) {
      console.error('Error fetching watched directories:', error);
      throw error;
    }
  }

  private async updateMonitoringDirectories(): Promise<void> {
    try {
      await invoke('update_monitoring_directories', { directories: this.state.directories });
      console.log('Updated monitoring directories:', this.state.directories);
    } catch (error) {
      console.error('Error updating monitoring directories:', error);
      throw error;
    }
  }

  public async startMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      try {
        await invoke('start_monitoring', { directories: this.state.directories });
        this.isMonitoring = true;
        console.log('Monitoring started for directories:', this.state.directories);
      } catch (error) {
        console.error('Error starting monitoring:', error);
        throw error;
      }
    } else {
      console.log('Monitoring is already active');
    }
  }

  public async removeDirectory(directory: string): Promise<void> {
    if (this.state.directories.includes(directory)) {
      try {
        await invoke('remove_directory', { directory });
        
        const newState: FileMonitorState = {
          ...this.state,
          directories: this.state.directories.filter(dir => dir !== directory),
        };
        // delete newState.fileChanges[directory];
        // delete newState.fileDetails[directory];
  
        this.state = newState;
        this.updateState(this.state);
        console.log(`Directory removed: ${directory}`);
  
        if (this.isMonitoring) {
          await this.updateMonitoringDirectories();
        }
      } catch (error) {
        console.error('Error removing directory:', error);
        throw error;
      }
    } else {
      console.log(`Directory not found in monitored list: ${directory}`);
    }
  }

}

