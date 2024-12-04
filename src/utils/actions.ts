import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import GppBadIcon from '@mui/icons-material/GppBad';
import LaunchIcon from '@mui/icons-material/Launch';
import AddBoxIcon from '@mui/icons-material/AddBox';
import Policy from '@mui/icons-material/Policy';
import { dirname } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/tauri';
import { ActionItem, KillProcessResponse, ProcessInfo } from './types';

// Function to get the FileMonitorContext's refreshDirectories function
const getRefreshDirectories = () => {
  const refreshDirectories = (window as any).__refreshDirectories;
  if (!refreshDirectories) {
    console.error('refreshDirectories not found on window object');
  }
  return refreshDirectories;
};

const updateMonitoredDirectories = async (dirPath: string) => {
  const DIRECTORIES_KEY = 'monitoredDirectories';
  const savedDirectories = localStorage.getItem(DIRECTORIES_KEY);
  const directories = savedDirectories ? JSON.parse(savedDirectories) : [];
  
  if (!directories.some((dir: { path: string }) => dir.path === dirPath)) {
    directories.push({ path: dirPath, isEnabled: true });
    localStorage.setItem(DIRECTORIES_KEY, JSON.stringify(directories));
    
    // Refresh the directories in the context
    const refreshDirectories = getRefreshDirectories();
    if (refreshDirectories) {
      await refreshDirectories();
    }
  }
};

export const filePathActions: ActionItem[] = [
  {
    icon: ContentCopyIcon,
    onClick: async (value) => {
      await navigator.clipboard.writeText(String(value));
    },
    message: 'Copied to Clipboard!'
  },
  {
    icon: FolderOpenIcon,
    onClick: async (value) => {
      const dirPath = await dirname(String(value));
      await invoke('open_file_explorer', { path: dirPath });
    }
  },
  {
    icon: Policy,
    onClick: async (value) => {
      await invoke('show_properties', { filePath: value });
    },
  },
  {
    icon: AddBoxIcon,
    onClick: async (value) => {
      const dirPath = await dirname(String(value));
      await invoke('add_directory', { directory: dirPath });
      await updateMonitoredDirectories(dirPath);
    },
    message: 'Now Monitoring!'
  }
];


// Rest of the file remains the same...
export const processActions: ActionItem[] = [
    {
        icon: FolderOpenIcon,
        onClick: async (value: string | ProcessInfo) => {
          if (typeof value === 'object' && 'path' in value) {
            const dirPath = await dirname(value.path);
            await invoke('open_file_explorer', { path: dirPath });
          } else {
            const dirPath = await dirname(value);
            await invoke('open_file_explorer', { path: dirPath });
          }
        }
      },
    {
        icon: GppBadIcon, 
        onClick: async (value: string | ProcessInfo) => {
            if (typeof value === 'object' && 'pid' in value) {
              const response = await invoke<KillProcessResponse>('kill_process', { 
                processInfo: value 
              });
              return response.message;
            }
            return;
          },
      },
      {
        icon: Policy,
        onClick: async (value: string | ProcessInfo) => {
          if (typeof value === 'object' && 'path' in value) {
            await invoke('show_properties', { filePath: value.path });
          } else {
            await invoke('show_properties', { filePath: value });
          }
        }
      }
];

export const registryActions: ActionItem[] = [
    {
        icon: ContentCopyIcon,
        onClick: async (value) => {
          await navigator.clipboard.writeText(String(value));
        },
        message: 'Copied to Clipboard!'
      },
    {
      icon: LaunchIcon,
      onClick: async (value) => {
        await invoke('open_registry_editor', { path: value });
      }
    }
];