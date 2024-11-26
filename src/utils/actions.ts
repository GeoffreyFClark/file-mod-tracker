import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import GppBadIcon from '@mui/icons-material/GppBad';
import LaunchIcon from '@mui/icons-material/Launch';
import Policy from '@mui/icons-material/Policy';
import { dirname } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/tauri';
import { ActionItem, KillProcessResponse, ProcessInfo } from './types';

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
  }
];

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