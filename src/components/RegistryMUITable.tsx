import React, { useState, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  type MRT_ColumnDef,
  createMRTColumnHelper,
} from 'material-react-table';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { RegistryTableDataRow, RegistryChangeEntry } from '../utils/types';
import { generateCSV, downloadCSV } from '../utils/export';

// Create type alias for the union type
type TableDataType = RegistryTableDataRow | RegistryChangeEntry & { Key: string };

const columnHelper = createMRTColumnHelper<TableDataType>();

// Columns for "keys" view mode
const keysColumns: MRT_ColumnDef<RegistryTableDataRow>[] = [
  {
    accessorKey: 'Changes',
    header: 'Changes',
    size: 50,
    minSize: 40,
    maxSize: 100,
  },
  {
    accessorKey: 'Key',
    header: 'Registry Key',
    size: 400,
    minSize: 40,
    maxSize: 1000,
  },
  {
    accessorFn: (row) => {
      // Get the most recent timestamp from entries
      return row.entries.reduce((latestTimestamp, entry) => {
        if (!latestTimestamp || new Date(entry.Timestamp) > new Date(latestTimestamp)) {
          return entry.Timestamp;
        }
        return latestTimestamp;
      }, '');
    },
    header: 'Last Modified',
    size: 200,
    minSize: 40,
    maxSize: 300,
    Cell: ({ cell }) => (
      new Date(cell.getValue<string>()).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'medium',
      })
    ),
  },
];

// Detail columns for both modal and changes view
const changesColumns: MRT_ColumnDef<RegistryChangeEntry & { Key: string }>[] = [
  {
    accessorKey: 'Key',
    header: 'Registry Key',
    size: 400,
    minSize: 40,
    maxSize: 1000,
  },
  {
    accessorKey: 'Type',
    header: 'Type',
    size: 100,
    minSize: 40,
    maxSize: 200,
  },
  {
    accessorKey: 'Value',
    header: 'Registry Value',
    size: 200,
    minSize: 40,
    maxSize: 400,
  },
  {
    accessorKey: 'PreviousData',
    header: 'Previous Data',
    size: 200,
    minSize: 40,
    maxSize: 400,
  },
  {
    accessorKey: 'NewData',
    header: 'New Data',
    size: 200,
    minSize: 40,
    maxSize: 400,
  },
  {
    accessorKey: 'Timestamp',
    header: 'Timestamp',
    size: 200,
    minSize: 40,
    maxSize: 300,
    Cell: ({ cell }) => (
      new Date(cell.getValue<string>()).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'medium',
      })
    ),
  },
];

interface RegistryMUITableProps {
  data: RegistryTableDataRow[];
}

const RegistryMUITable: React.FC<RegistryMUITableProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'keys' | 'changes'>('keys');
  const [rowSelectionMain, setRowSelectionMain] = useState<{ [key: string]: boolean }>({});
  const [rowSelectionModal, setRowSelectionModal] = useState<{ [key: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Use useMemo to compute selected entries for modal
  const selectedEntries = useMemo(() => {
    if (!isModalOpen || selectedKeys.length === 0) {
      return [];
    }
    return data
      .filter(row => selectedKeys.includes(row.Key))
      .flatMap(row => row.entries.map(entry => ({ ...entry, Key: row.Key })));
  }, [data, selectedKeys, isModalOpen]);

  // Handle viewing detailed changes
  const handleViewChanges = () => {
    const selectedRows = mainTable.getSelectedRowModel().rows;
    const keys = selectedRows.map(row => (row.original as RegistryTableDataRow).Key);
    setSelectedKeys(keys);
    setRowSelectionModal({});
    setIsModalOpen(true);
  };

  // Export functions
  const handleExportRows = (rows: MRT_Row<any>[]) => {
    const rowData = rows.map((row) => {
      const data = row.original;
      const exportObj: { [key: string]: string | number } = {};
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value) || value === null || value === undefined) {
          exportObj[key] = '';
        } else if (typeof value === 'object') {
          exportObj[key] = JSON.stringify(value);
        } else if (typeof value === 'number') {
          exportObj[key] = value;
        } else {
          exportObj[key] = String(value);
        }
      });
      return exportObj;
    });
    const csv = generateCSV(rowData);
    downloadCSV(csv);
  };

  const handleExportData = () => {
    if (viewMode === 'keys') {
      const exportData = data.map(row => ({
        Key: row.Key,
        Changes: row.Changes,
        Entries: JSON.stringify(row.entries),
      }));
      const csv = generateCSV(exportData);
      downloadCSV(csv);
    } else {
      const exportData = data.flatMap(row =>
        row.entries.map(entry => ({
          Key: row.Key,
          Type: entry.Type,
          Value: entry.Value,
          PreviousData: entry.PreviousData,
          NewData: entry.NewData,
          Timestamp: entry.Timestamp,
        }))
      );
      const csv = generateCSV(exportData);
      downloadCSV(csv);
    }
  };

  const handleModalExportData = () => {
    const exportData = selectedEntries.map(entry => ({
      Key: entry.Key,
      Type: entry.Type,
      Value: entry.Value,
      PreviousData: entry.PreviousData,
      NewData: entry.NewData,
      Timestamp: entry.Timestamp,
    }));
    const csv = generateCSV(exportData);
    downloadCSV(csv);
  };

  // Use useMemo for table configuration
  const tableConfig = useMemo(() => {
    if (viewMode === 'keys') {
      return {
        data: data as RegistryTableDataRow[],
        columns: keysColumns as MRT_ColumnDef<any>[],
      };
    } else {
      const flattenedData = data.flatMap(row =>
        row.entries.map(entry => ({ ...entry, Key: row.Key }))
      );
      return {
        data: flattenedData as Array<RegistryChangeEntry & { Key: string }>,
        columns: changesColumns as MRT_ColumnDef<any>[],
      };
    }
  }, [data, viewMode]);

  // Initialize main table
  const mainTable = useMaterialReactTable({
    columns: tableConfig.columns,
    data: tableConfig.data,
    enableRowSelection: true,
    state: { rowSelection: rowSelectionMain },
    onRowSelectionChange: setRowSelectionMain,
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: 2, p: 1, alignItems: 'center' }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="view-mode-select-label">View Mode</InputLabel>
          <Select
            labelId="view-mode-select-label"
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value as 'keys' | 'changes');
              setRowSelectionMain({}); // Reset selection when changing view mode
            }}
            label="View Mode"
          >
            <MenuItem value="keys">View Keys</MenuItem>
            <MenuItem value="changes">View Changes</MenuItem>
          </Select>
        </FormControl>

        <Button
          onClick={handleViewChanges}
          disabled={viewMode === 'changes' || Object.keys(rowSelectionMain).length === 0}
          startIcon={<VisibilityIcon />}
        >
          View Changes
        </Button>
        <Button
          disabled={Object.keys(rowSelectionMain).length === 0}
          onClick={() => handleExportRows(mainTable.getSelectedRowModel().rows)}
          startIcon={<FileDownloadIcon />}
        >
          Export Selected
        </Button>
        <Button onClick={handleExportData} startIcon={<FileDownloadIcon />}>
          Export All
        </Button>
      </Box>
    ),
    defaultColumn: {
      minSize: 40,
      maxSize: 1000,
    },
    muiTablePaperProps: {
      sx: { borderRadius: '.5rem' },
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 25,
      },
    },
  });

  // Initialize detail table for the modal
  const detailTable = useMaterialReactTable({
    columns: changesColumns,
    data: selectedEntries,
    enableRowSelection: true,
    state: { rowSelection: rowSelectionModal },
    onRowSelectionChange: setRowSelectionModal,
    enableSorting: true,
    enablePagination: true,
    enableColumnResizing: false, // Disable column resizing
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: 2, p: 1, alignItems: 'center' }}>
        <Button onClick={handleModalExportData} startIcon={<FileDownloadIcon />}>
          Export All
        </Button>
        <Button
          disabled={!table.getIsSomeRowsSelected()}
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
      sx: { borderRadius: '.5rem' },
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 25,
      },
    },
  });

  return (
    <>
      <MaterialReactTable table={mainTable} />

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>Registry Change Details</DialogTitle>
        <DialogContent>
          <MaterialReactTable table={detailTable} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RegistryMUITable;
