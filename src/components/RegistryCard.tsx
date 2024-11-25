import React from 'react';
import { Switch } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import LaunchIcon from '@mui/icons-material/Launch';
import { invoke } from '@tauri-apps/api/tauri';
import { DARK_TEXT_DISABLED, DARK_TEXT_GREEN, DARK_TEXT_SELECTED } from '../utils/constants';


function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

interface RegistryKeyProps {
  keyPath: string;
  isMonitored: boolean;
  onToggle: () => void;
  onRemove: () => void;
}


const RegistryCard: React.FC<RegistryKeyProps> = ({ keyPath, isMonitored, onToggle, onRemove }) => {


  const handleOpenRegistry = async () => {
    try {
      await invoke('open_registry_editor', { path: keyPath });
    } catch (error) {
      console.error('Failed to open file explorer:', error);
    }
  };

  return(
      <div
          className={classNames(
            'shadow rounded-lg p-4 mb-4 flex justify-between items-center border-transparent border border-hover transition',
            isMonitored ? 'bg-secondary' : 'bg-secondary'
          )}
        >
          <div className="flex items-center flex-grow mr-2">

          <button
                onClick={ handleOpenRegistry }
                className="mr-3 focus:outline-none"
                aria-label="Open in file explorer"
              >
                <LaunchIcon 
                  sx={{ 
                    color: isMonitored ? DARK_TEXT_SELECTED : DARK_TEXT_DISABLED,
                    transition: '0.150s ease-in-out',
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      color: isMonitored ? DARK_TEXT_GREEN : DARK_TEXT_DISABLED,
                    }
                  }} 
                />
              </button>

          <span
            className={classNames(
              'color-app flex-grow mr-2 codeText',
              !isMonitored ? 'line-through color-disabled' : ''
            )}
          >
            {keyPath}
          </span>
          </div>
          <div className="flex items-center">
            <Switch
              checked={isMonitored}
              onChange={onToggle}
              className={classNames(
                isMonitored ? 'bg-green' : 'bg-disabled',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:bg-app-blue focus:ring-offset-2 mr-2'
              )}
            >
              <span className="sr-only">Toggle registry key monitoring</span>
              <span
                className={classNames(
                  isMonitored ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
            <button
              onClick={onRemove}
              className="app-green transition hover:text-red-600 focus:outline-none"
              aria-label="Remove registry key"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      );
}




export default RegistryCard;