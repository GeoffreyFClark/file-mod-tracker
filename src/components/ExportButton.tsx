import React, { useRef } from 'react';
import { DataTable } from 'simple-datatables';
import ExportIcon from './icons/ExportIcon';
import CSVIcon from './icons/CSVIcon';
import JSONIcon from './icons/JSONIcon';
import TXTIcon from './icons/TXTIcon';
import SQLIcon from './icons/SQLIcon';
import useDropdown from '../hooks/useDropdown';

interface ExportButtonProps {
  dataTableRef: React.RefObject<DataTable | null>;
  handleExportCSV: (dataTable: DataTable) => void;
  handleExportJSON: (dataTable: DataTable) => void;
  handleExportTXT: (dataTable: DataTable) => void;
  handleExportSQL: (dataTable: DataTable) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  dataTableRef,
  handleExportCSV,
  handleExportJSON,
  handleExportTXT,
  handleExportSQL
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, toggleDropdown] = useDropdown(buttonRef, dropdownRef);

  const handleExport = (exportFunction: (dataTable: DataTable) => void) => {
    if (dataTableRef.current) {
      exportFunction(dataTableRef.current);
    } else {
      console.error('DataTable reference is null');
    }
    toggleDropdown();
  };

  return (
    <div className='relative inline-block'>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        type='button'
        className='flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 sm:w-auto'
      >
        Export as
        <ExportIcon />
      </button>
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className='absolute right-0 mt-2 w-52 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700'
        >
          <ul className='p-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400'>
            <li>
              <button
                onClick={() => handleExport(handleExportCSV)}
                className='group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white'
              >
                <CSVIcon />
                <span>Export CSV</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleExport(handleExportJSON)}
                className='group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white'
              >
                <JSONIcon />
                <span>Export JSON</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleExport(handleExportTXT)}
                className='group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white'
              >
                <TXTIcon />
                <span>Export TXT</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleExport(handleExportSQL)}
                className='group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white'
              >
                <SQLIcon />
                <span>Export SQL</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExportButton;