import React, { useEffect, useRef } from 'react';
import { DataTable } from 'simple-datatables';
import { getTableConfig } from '../utils/tableConfig';
import { TableRow } from '../utils/types';
import SortIcon from './icons/SortIcon';
import ExportButton from './ExportButton';
import {
  handleExportCSV,
  handleExportJSON,
  handleExportTXT,
  handleExportSQL,
} from '../utils/exportFunctions';
import ReactDOM from 'react-dom';

interface ModalTableProps {
  selectedEntries: TableRow[];
  uniqueIdModal: string;
}

const ModalTable: React.FC<ModalTableProps> = ({ selectedEntries, uniqueIdModal }) => {
  const detailsTableRef = useRef<HTMLTableElement>(null);
  const detailsDataTableRef = useRef<DataTable | null>(null);

  useEffect(() => {
    if (detailsTableRef.current && selectedEntries.length > 0) {
      // Destroy any existing instance before initializing
      if (detailsDataTableRef.current) {
        detailsDataTableRef.current.destroy();
        detailsDataTableRef.current = null;
      }

      // Initialize DataTable after the data has been rendered
      detailsDataTableRef.current = new DataTable(
        `#details-table${uniqueIdModal}`,
        getTableConfig(uniqueIdModal)
      );

      // Insert ExportButton into the correct container
      const exportButtonContainer = document.getElementById(`exportButtonContainer${uniqueIdModal}`);
      if (exportButtonContainer) {
        const exportButtonElement = document.createElement('div');
        exportButtonElement.id = `exportButton${uniqueIdModal}`;
        exportButtonContainer.appendChild(exportButtonElement);

        // Render ExportButton into the new element
        const exportButton = <ExportButton 
          dataTableRef={detailsDataTableRef} 
          handleExportCSV={handleExportCSV}
          handleExportJSON={handleExportJSON}
          handleExportTXT={handleExportTXT}
          handleExportSQL={handleExportSQL}
        />;
        ReactDOM.render(exportButton, exportButtonElement);
      }
    }

    return () => {
      if (detailsDataTableRef.current) {
        detailsDataTableRef.current.destroy();
        detailsDataTableRef.current = null;
      }
      // Clean up the ExportButton
      const exportButtonElement = document.getElementById(`exportButton${uniqueIdModal}`);
      if (exportButtonElement) {
        ReactDOM.unmountComponentAtNode(exportButtonElement);
        exportButtonElement.remove();
      }
    };
  }, [selectedEntries, uniqueIdModal]);

  return (
    <div className='p-5 rounded-lg shadow bg-white dark:bg-gray-900 antialiased'>
      <table id={`details-table${uniqueIdModal}`} ref={detailsTableRef}>
        {/* Modal Table Headers */}
        <thead>
          <tr>
            <th>
              <span className='flex items-center'>
                Path
                <SortIcon />
              </span>
            </th>
            <th data-type='number'>
              <span className='flex items-center'>
                PID
                <SortIcon />
              </span>
            </th>
            <th>
              <span className='flex items-center'>
                Type
                <SortIcon />
              </span>
            </th>
            <th>
              <span className='flex items-center'>
                Timestamp
                <SortIcon />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {selectedEntries.map((row: TableRow, index: number) => (
            <tr key={index} className='hover:bg-gray-50 dark:hover:bg-gray-800'>
              <td className='font-medium text-gray-900 whitespace-nowrap dark:text-white'>
                {row.Path}
              </td>
              <td>{row.PID}</td>
              <td>{row.Type}</td>
              <td>{row.Timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ModalTable;