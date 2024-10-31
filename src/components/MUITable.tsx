// src/components/MUITable.tsx
import React, { useState, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  createMRTColumnHelper,
} from 'material-react-table';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { generateCsv, download } from 'export-to-csv';
import { DataRow, parseBackendDataUnique, parseBackendDataAll } from '../utils/parseBackendData';
import { csvConfig } from '../utils/export';

// Initialize column helper
const columnHelper = createMRTColumnHelper<DataRow>();

// Define columns for "Show Unique" mode
const columnsUnique = [
  columnHelper.accessor('changes', {
    header: 'Changes',
    size: 50,
    Cell: ({ cell }) => cell.getValue<number>(),
  }),
  columnHelper.accessor('path', {
    header: 'Path',
    size: 300,
  }),
  columnHelper.accessor('timestamp', {
    header: 'Last Modified',
    size: 200,
    Cell: ({ cell }) =>
      new Date(cell.getValue<string>()).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'medium',
      }),
  }),
];

// Define columns for "Show All" mode
const columnsAll = [
  columnHelper.accessor('path', {
    header: 'Path',
    size: 400,
  }),
  columnHelper.accessor('pid', {
    header: 'PID',
    size: 60,
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    size: 100,
  }),
  columnHelper.accessor('size', {
    header: 'Size',
    size: 100,
    Cell: ({ cell }) => `${cell.getValue<string>()}`,
  }),
  columnHelper.accessor('timestamp', {
    header: 'Timestamp',
    size: 200,
    Cell: ({ cell }) =>
      new Date(cell.getValue<string>()).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'medium',
      }),
  }),
];

interface MUITableProps {
  data: any[]; // Raw data from backend
}

const MUITable: React.FC<MUITableProps> = ({ data }) => {
  // State for view mode
  const [viewMode, setViewMode] = useState<'unique' | 'all'>('unique');

  // State for main table's row selection
  const [rowSelectionMain, setRowSelectionMain] = useState<{ [key: string]: boolean }>({});

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State to store selected paths for modal
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  // State for modal table's row selection
  const [rowSelectionModal, setRowSelectionModal] = useState<{ [key: string]: boolean }>({});

  // Parse data based on view mode
  const parsedData = useMemo(() => {
    if (viewMode === 'unique') {
      return parseBackendDataUnique(data);
    } else {
      return parseBackendDataAll(data);
    }
  }, [data, viewMode]);

  // Select appropriate columns based on view mode
  const columns = useMemo(() => {
    if (viewMode === 'unique') {
      return columnsUnique;
    } else {
      return columnsAll;
    }
  }, [viewMode]);

  // Function to export selected rows
  const handleExportRows = (rows: MRT_Row<DataRow>[]) => {
    const rowData = rows.map((row) => row.original);
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  // Function to export all data
  const handleExportData = () => {
    const csv = generateCsv(csvConfig)(parsedData);
    download(csvConfig)(csv);
  };

  // Function to handle "View Changes" button click
  const handleViewChanges = () => {
    // Get selected rows from main table
    const selectedRows = mainTable.getSelectedRowModel().rows;
    // Extract paths of selected files
    const paths = selectedRows.map((row) => row.original.path);
    setSelectedPaths(paths);
    // Open the modal
    setIsModalOpen(true);
  };

  // Function to retrieve entries for specific paths
  const getEntriesForPaths = (backendData: any[], paths: string[]): DataRow[] => {
    const entries: DataRow[] = [];

    backendData.forEach((watcher) => {
      watcher.files.forEach((file: any) => {
        if (paths.includes(file.Path)) {
          file.entries.forEach((entry: any) => {
            const dataRow: DataRow = {
              path: entry.Path || '',
              pid: entry.PID || '',
              type: entry.Type || '',
              size: entry.Size || '',
              timestamp: entry.Timestamp || '',
              // 'changes' is intentionally omitted
            };
            entries.push(dataRow);
          });
        }
      });
    });

    return entries;
  };

  // Compute modal data based on selected paths and main data
  const modalData = useMemo(() => {
    if (!isModalOpen || selectedPaths.length === 0) {
      return [];
    }
    return getEntriesForPaths(data, selectedPaths);
  }, [data, selectedPaths, isModalOpen]);

  // Initialize main table instance
  const mainTable = useMaterialReactTable<DataRow>({
    columns,
    data: parsedData,
    enableRowSelection: true,
    state: { rowSelection: rowSelectionMain },
    onRowSelectionChange: setRowSelectionMain,
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    renderTopToolbarCustomActions: ({ table }) => (
      <Box
        sx={{
          display: 'flex',
          gap: '16px',
          padding: '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Dropdown Menu for View Mode */}
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="view-mode-select-label">View Mode</InputLabel>
          <Select
            labelId="view-mode-select-label"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'unique' | 'all')}
            label="View Mode"
            sx={{ width: '100%' }}
          >
            <MenuItem value="unique">Files</MenuItem>
            <MenuItem value="all">Modifications</MenuItem>
          </Select>
        </FormControl>
    
        {/* "View Changes" Button */}
        <Button
          onClick={handleViewChanges}
          disabled={viewMode === 'all' || Object.keys(rowSelectionMain).length === 0}
          startIcon={<VisibilityIcon />}
        >
          View Changes
        </Button>
    
        {/* Export Selected Button */}
        <Button
          disabled={Object.keys(rowSelectionMain).length === 0}
          onClick={() => handleExportRows(mainTable.getSelectedRowModel().rows)}
          startIcon={<FileDownloadIcon />}
        >
          Export Selected
        </Button>
    
        {/* Export All Button */}
        <Button onClick={handleExportData} startIcon={<FileDownloadIcon />}>
          Export All
        </Button>
      </Box>
    ),
    
    defaultColumn: {
      minSize: 40,
      maxSize: 100,
    },
    muiTablePaperProps: {
      sx: {
        borderRadius: '.5rem',
      },
    },
    initialState: {
      pagination: {
        pageIndex: 0, // Set default page index
        pageSize: 25, // Set default rows per page
      },
    },
  });

  // Initialize modal table instance
  const modalTable = useMaterialReactTable<DataRow>({
    columns: columnsAll,
    data: modalData,
    enableRowSelection: true, // Enable row selection
    state: { rowSelection: rowSelectionModal }, // Connect modal row selection state
    onRowSelectionChange: setRowSelectionModal, // Update modal row selection state
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    renderTopToolbarCustomActions: ({ table }) => (
      <Box
        sx={{
          display: 'flex',
          gap: '16px',
          padding: '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Export All Button for Modal's Table */}
        <Button onClick={handleModalExportData} startIcon={<FileDownloadIcon />}>
          Export All
        </Button>

        {/* Export Selected Button for Modal's Table */}
        <Button
          disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
          onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
          startIcon={<FileDownloadIcon />}
        >
          Export Selected
        </Button>
      </Box>
    ),
    defaultColumn: {
      minSize: 40,
      maxSize: 1000,
    },
    muiTablePaperProps: {
      sx: {
        borderRadius: '.5rem',
      },
    },
  });

  const handleModalExportData = () => {
    const csv = generateCsv(csvConfig)(modalData);
    download(csvConfig)(csv);
  };

  return (
    <>
      {/* Main Table */}
      <MaterialReactTable table={mainTable} />

      {/* Modal for Viewing Changes */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>View Changes</DialogTitle>
        <DialogContent>
          {/* Modal's Table */}
          <MaterialReactTable table={modalTable} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MUITable;
