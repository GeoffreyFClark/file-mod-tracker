import React, { useState, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_Row,
  type MRT_ColumnDef,
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
  ThemeProvider,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { RegistryTableDataRow, RegistryChangeEntry } from '../utils/types';
import { generateCSV, downloadCSV } from '../utils/export';
import {
  DARK_PRIMARY,
  DARK_PRIMARY_HOVER,
  DARK_TEXT_SELECTED,
  DARK_TEXT_ENABLED,
  DARK_TEXT_DISABLED,
  DARK_SECONDARY,
} from '../utils/constants';
import CustomCell from './CustomCell';
import { registryActions } from '../utils/actions';
import { createAppTheme } from '../utils/theme';


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
    Cell: ({ cell }) => <CustomCell value={cell.getValue<string>()} actions={registryActions} />,
  },
  {
    accessorFn: (row) => {
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
    Cell: ({ cell }) => <CustomCell value={cell.getValue<string>()} actions={registryActions} />,
    size: 300,    
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
  darkMode?: boolean;
}

const RegistryMUITable: React.FC<RegistryMUITableProps> = ({ data, darkMode = true }) => {
  const [viewMode, setViewMode] = useState<'keys' | 'changes'>('keys');
  const [rowSelectionMain, setRowSelectionMain] = useState<{ [key: string]: boolean }>({});
  const [rowSelectionModal, setRowSelectionModal] = useState<{ [key: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Create custom theme
  const theme = useMemo(
    () => createAppTheme({ darkMode }),
    [darkMode]
  );

  const selectedEntries = useMemo(() => {
    if (!isModalOpen || selectedKeys.length === 0) {
      return [];
    }
    return data
      .filter(row => selectedKeys.includes(row.Key))
      .flatMap(row => row.entries.map(entry => ({ ...entry, Key: row.Key })));
  }, [data, selectedKeys, isModalOpen]);

  const handleViewChanges = () => {
    const selectedRows = mainTable.getSelectedRowModel().rows;
    const keys = selectedRows.map(row => (row.original as RegistryTableDataRow).Key);
    setSelectedKeys(keys);
    setRowSelectionModal({});
    setIsModalOpen(true);
  };

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

  const mainTable = useMaterialReactTable({
    columns: tableConfig.columns,
    data: tableConfig.data,
    enableRowSelection: true,
    state: { rowSelection: rowSelectionMain },
    onRowSelectionChange: setRowSelectionMain,
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    // @ts-ignore
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: 2, p: 1, alignItems: 'center' }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="view-mode-select-label">View Mode</InputLabel>
          <Select
            labelId="view-mode-select-label"
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value as 'keys' | 'changes');
              setRowSelectionMain({});
            }}
            label="View Mode"
            sx={{
              backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
              color: darkMode ? DARK_TEXT_SELECTED : '#000000',
              '& .MuiSelect-icon': {
                color: darkMode ? DARK_TEXT_SELECTED : '#000000',
              },
            }}
          >
            <MenuItem value="keys">Keys</MenuItem>
            <MenuItem value="changes">Modifications</MenuItem>
          </Select>
        </FormControl>

        <Button
          onClick={handleViewChanges}
          disabled={viewMode === 'changes' || Object.keys(rowSelectionMain).length === 0}
          startIcon={<VisibilityIcon />}
          sx={{
            backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
            color: darkMode ? DARK_TEXT_ENABLED : '#000000',
            '&.Mui-disabled': {
              color: darkMode ? DARK_TEXT_DISABLED : '#aaaaaa',
            },
            '&:hover': {
              backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
            },
          }}
        >
          View Changes
        </Button>
        <Button
          disabled={Object.keys(rowSelectionMain).length === 0}
          onClick={() => handleExportRows(mainTable.getSelectedRowModel().rows)}
          startIcon={<FileDownloadIcon />}
          sx={{
            backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
            color: darkMode ? DARK_TEXT_ENABLED : '#000000',
            '&.Mui-disabled': {
              color: darkMode ? DARK_TEXT_DISABLED : '#aaaaaa',
            },
            '&:hover': {
              backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
            },
          }}
        >
          Export Selected
        </Button>
        <Button
          onClick={handleExportData}
          startIcon={<FileDownloadIcon />}
          sx={{
            backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
            color: darkMode ? DARK_TEXT_ENABLED : '#000000',
            '&:hover': {
              backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
            },
          }}
        >
          Export All
        </Button>
      </Box>
    ),
    muiTablePaperProps: {
      sx: {
        borderRadius: '.5rem',
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
      },
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 25 },
      sorting: [
        {
          id: 'Timestamp',
          desc: true
        }
      ],
    },
    // @ts-ignore
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
        '&:hover': {
          backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
        },
      },
    }),
    // @ts-ignore
    muiTableBodyCellProps: ({ cell }) => ({
      sx: {
        color: darkMode ? DARK_TEXT_SELECTED : '#000000',
        borderBottom: `1px solid ${darkMode ? '#404040' : '#e0e0e0'}`,
      },
    }),
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
        color: darkMode ? DARK_TEXT_SELECTED : '#000000',
        fontWeight: 'bold',
      },
    },
    muiTopToolbarProps: {
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
        color: darkMode ? DARK_TEXT_SELECTED : '#000000',
      },
    },
    muiBottomToolbarProps: {
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
        color: darkMode ? DARK_TEXT_SELECTED : '#000000',
      },
    },
    muiTableContainerProps: {
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
      },
    },
  });

  const detailTable = useMaterialReactTable({
    columns: changesColumns,
    data: selectedEntries,
    enableRowSelection: true,
    state: { rowSelection: rowSelectionModal },
    onRowSelectionChange: setRowSelectionModal,
    enableSorting: true,
    enablePagination: true,
    enableColumnResizing: false,
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: 2, p: 1, alignItems: 'center' }}>
        <Button
          onClick={handleModalExportData}
          startIcon={<FileDownloadIcon />}
          sx={{
            backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
            color: darkMode ? DARK_TEXT_ENABLED : '#000000',
            '&:hover': {
              backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
            },
          }}
        >
          Export All
        </Button>
        <Button
          disabled={!table.getIsSomeRowsSelected()}
          onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
          startIcon={<FileDownloadIcon />}
          sx={{
            backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
            color: darkMode ? DARK_TEXT_ENABLED : '#000000',
            '&.Mui-disabled': {
              color: darkMode ? DARK_TEXT_DISABLED : '#aaaaaa',
            },
            '&:hover': {
              backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
            },
          }}
        >
          Export Selected
        </Button>
      </Box>
    ),
    muiTablePaperProps: {
      sx: {
        borderRadius: '.5rem',
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
      },
    },
    // @ts-ignore
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
        '&:hover': {
          backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
        },
      },
    }),
    // @ts-ignore
    muiTableBodyCellProps: ({ cell }) => ({
      sx: {
        color: darkMode ? DARK_TEXT_SELECTED : '#000000',
        borderBottom: `1px solid ${darkMode ? '#404040' : '#e0e0e0'}`,
      },
    }),
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
        color: darkMode ? DARK_TEXT_SELECTED : '#000000',
        fontWeight: 'bold',
      },
    },
    muiTopToolbarProps: {
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
        color: darkMode ? DARK_TEXT_SELECTED : '#000000',
      },
    },
    muiBottomToolbarProps: {
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
        color: darkMode ? DARK_TEXT_SELECTED : '#000000',
      },
    },
    muiTableContainerProps: {
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
      },
    },
    defaultColumn: {
      minSize: 40,
      maxSize: 1000,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 25,
      },
      sorting: [
        {
          id: 'Timestamp',
          desc: true
        }
      ],
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <MaterialReactTable table={mainTable} />

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: DARK_SECONDARY,
            borderRadius: '0.5rem',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle
          sx={{
            color: darkMode ? DARK_TEXT_SELECTED : '#000000',
          }}
        >
          Registry Change Details
        </DialogTitle>
        <DialogContent>
          <MaterialReactTable table={detailTable} />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsModalOpen(false)}
            sx={{
              color: darkMode ? DARK_TEXT_ENABLED : '#000000',
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default RegistryMUITable;