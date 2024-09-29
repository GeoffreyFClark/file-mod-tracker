import React, { useEffect, useRef, useCallback, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { DataTable } from 'simple-datatables';
import {
  handleExportCSV,
  handleExportJSON,
  handleExportTXT,
  handleExportSQL,
} from '../utils/exportFunctions';
import { getTableConfig } from '../utils/tableConfig';
import { TableDataRow } from '../utils/types';
import { addRowsToDataTable } from '../utils/dataTableUtils';

import SortIcon from './icons/SortIcon';

import { Button, Modal } from 'flowbite-react';
import ModalTable from './ModalTable';
import ExportButton from './ExportButton';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';

interface LogsTableProps {
  initialData: TableDataRow[];
}

const LogsTable = forwardRef<{ updateData: (newData: TableDataRow[]) => void }, LogsTableProps>(({ initialData }, ref) => {
  console.log('LogsTable component rendering');
  const uniqueIdMain = useMemo(() => 'Main', []);
  const uniqueIdModal = useMemo(() => 'Modal', []);

  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<DataTable | null>(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<TableDataRow['entries']>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [data, setData] = useState(initialData);

  const initializeDataTable = useCallback(() => {
    console.log('Initializing DataTable with data:', data);
    const exportTableId = `export-table${uniqueIdMain}`;

    if (dataTableRef.current) {
      console.log('DataTable already initialized');
      return;
    }

    if (tableRef.current) {
      console.log('Creating new DataTable');
      dataTableRef.current = new DataTable(`#${exportTableId}`, getTableConfig(uniqueIdMain));

      dataTableRef.current.on('datatable.init', function () {
        console.log('DataTable initialized');
        const tbody = document.getElementById(exportTableId)?.querySelector('tbody');
        if (tbody) {
          tbody.addEventListener('click', function (event) {
            const target = event.target as HTMLElement;
            if (target && target.tagName === 'BUTTON') {
              const tr = target.closest('tr');
              if (!tr) return;
              const path = tr.getAttribute('data-path');
              if (!path) return;
              const rowData = data.find((row) => row.Path === path);
              if (rowData) {
                handleRowClick(rowData.entries);
              }
            }
          });
        }
        const exportButtonContainer = document.getElementById(`exportButtonContainer${uniqueIdMain}`);
        if (exportButtonContainer) {
          const root = createRoot(exportButtonContainer);
          root.render(
            <ExportButton
              dataTableRef={dataTableRef}
              handleExportCSV={handleExportCSV}
              handleExportJSON={handleExportJSON}
              handleExportTXT={handleExportTXT}
              handleExportSQL={handleExportSQL}
            />
          );
        }
        setIsInitialized(true);
      });
    }
  }, [data, uniqueIdMain]);

  useEffect(() => {
    initializeDataTable();

    return () => {
      if (dataTableRef.current) {
        console.log('Cleaning up DataTable');
        dataTableRef.current.destroy();
      }
      const exportButtonContainer = document.getElementById(`exportButtonContainer${uniqueIdMain}`);
      if (exportButtonContainer) {
        ReactDOM.unmountComponentAtNode(exportButtonContainer);
      }
    };
  }, [initializeDataTable, uniqueIdMain]);

  const updateData = useCallback((newData: TableDataRow[]) => {
    console.log('Updating data in LogsTable');
    if (isInitialized && dataTableRef.current) {
      const newRows = newData
        .filter(row => !data.some(existingRow => existingRow.Path === row.Path))
        .map(row => ({
          cells: [
            { data: row.Path },
            { data: row.Changes > 1 ? '*' : row.PID, text: row.Changes > 1 ? '*' : row.PID.toString() },
            { data: row.Changes > 1 ? '*' : row.Type },
            { data: row.Timestamp },
            { data: `<button class="inline-flex items-center rounded-md bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">View ${row.Changes}</button>` },
          ]
        }));
      addRowsToDataTable(dataTableRef.current, newRows);
    }
    setData(newData);
  }, [isInitialized, data]);

  useImperativeHandle(ref, () => ({
    updateData
  }));

  const handleRowClick = useCallback((entries: TableDataRow['entries']) => {
    if (entries && entries.length > 0) {
      setSelectedEntries(entries);
      setModalOpen(true);
      console.log(`Detailed entries for ${entries[0]?.Path}:`, entries);
    } else {
      console.log('No entries to display in modal.');
    }
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <div className='p-5 rounded-lg shadow bg-white dark:bg-gray-900 antialiased'>
      <table id={`export-table${uniqueIdMain}`} ref={tableRef}>
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
                Details
                <SortIcon />
              </span>
            </th>
            <th>
              <span className='flex items-center'>
                Timestamp
                <SortIcon />
              </span>
            </th>
            <th>
              <span className='flex items-center'>
                Changes
                <SortIcon />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={`${row.Path}-${row.Timestamp}-${index}`}
              data-path={row.Path}
              className='hover:bg-gray-50 dark:hover:bg-gray-800'
            >
              <td className='font-medium text-gray-900 whitespace-nowrap dark:text-white'>
                {row.Path}
              </td>
              <td>{row.Changes > 1 ? '*' : row.PID}</td>
              <td>{row.Changes > 1 ? '*' : row.Type}</td>
              <td>{row.Timestamp}</td>
              <td>
                <button 
                  className="inline-flex items-center rounded-md bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  View {row.Changes}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        dismissible
        show={isModalOpen}
        onClose={closeModal}
        size='6xl'
        className='modal-background'
      >
        <Modal.Header>
          Changes made for file {selectedEntries[0]?.Path}
        </Modal.Header>
        <Modal.Body>
          <ModalTable
            selectedEntries={selectedEntries}
            uniqueIdModal={uniqueIdModal}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={closeModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

export default LogsTable;