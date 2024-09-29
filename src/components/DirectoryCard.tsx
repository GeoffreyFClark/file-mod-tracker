import React from 'react';
import { Switch } from '@headlessui/react';

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

interface Directory {
  path: string;
  isMonitored: boolean;
}

interface DirectoryCardProps {
  directory: Directory;
  onAdd: () => void;
  onRemove: () => void;
}

const DirectoryCard: React.FC<DirectoryCardProps> = ({ directory, onAdd, onRemove }) => (
  <div
    className={classNames(
      'shadow rounded-lg p-4 mb-4 flex justify-between items-center',
      directory.isMonitored ? 'bg-white' : 'bg-gray-100'
    )}
  >
    <span
      className={classNames(
        'text-gray-800',
        !directory.isMonitored ? 'line-through text-gray-500' : ''
      )}
    >
      {directory.path}
    </span>
    <Switch
      checked={directory.isMonitored}
      onChange={() => directory.isMonitored ? onRemove() : onAdd()}
      className={classNames(
        directory.isMonitored ? 'bg-indigo-600' : 'bg-gray-200',
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'
      )}
    >
      <span className="sr-only">Toggle directory monitoring</span>
      <span
        className={classNames(
          directory.isMonitored ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
        )}
      />
    </Switch>
  </div>
);

export default DirectoryCard;