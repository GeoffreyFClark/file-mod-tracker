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
  ThemeProvider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { generateCsv, download } from 'export-to-csv';
import { DataRow, parseBackendDataUnique, parseBackendDataAll } from '../utils/parseBackendData';
import { csvConfig } from '../utils/export';
import {
  DARK_PRIMARY,
  DARK_PRIMARY_HOVER,
  DARK_TEXT_SELECTED,
  DARK_TEXT_ENABLED,
  DARK_TEXT_DISABLED,
  DARK_SECONDARY,
  DARK_TEXT_GREEN,
} from '../utils/constants';
import CustomCell from './CustomCell';
import { filePathActions, processActions } from '../utils/actions';
import { createAppTheme } from '../utils/theme';
import { ExportButton } from './ExportButton'

interface DirectoryData {
  watcherPath: string;
  changeCount: number;
  Timestamp: string;
}


const directoryColumnHelper = createMRTColumnHelper<DirectoryData>();


const columnsDirectories = [
  directoryColumnHelper.accessor('changeCount', {
    header: 'Events',
    size: 150,
    Cell: ({ cell }) => cell.getValue<number>(),
  }),
  directoryColumnHelper.accessor('watcherPath', {
    header: 'Directory',
    size: 400,
    Cell: ({ cell }) => <CustomCell value={cell.getValue<string>()} actions={filePathActions} />,
  }),

  directoryColumnHelper.accessor('Timestamp', {
    header: 'Last Modified',
    size: 200,
    Cell: ({ cell }) =>
      new Date(cell.getValue<string>()).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'medium',
      }),
  }),
];


const parseBackendDataDirectories = (data: any[]): DirectoryData[] => {
  return data.map(watcher => {
    const totalChanges = watcher.files.reduce((sum: number, file: any) => 
      sum + file.entries.length, 0);

    let Timestamp = new Date(0);
    watcher.files.forEach((file: any) => {
      file.entries.forEach((entry: any) => {
        const entryTime = new Date(entry.Timestamp);
        if (entryTime > Timestamp) {
          Timestamp = entryTime;
        }
      });
    });

    return {
      watcherPath: watcher.Watcher, // <-- Changed this line from watcher.path to watcher.Watcher
      changeCount: totalChanges,
      Timestamp: Timestamp.toISOString(),
    };
  });
};

const getEntriesForWatcher = (backendData: any[], watcherPath: string): DataRow[] => {
  const entries: DataRow[] = [];
  const watcher = backendData.find(w => w.Watcher === watcherPath);
  
  if (watcher) {
    watcher.files.forEach((file: any) => {
      file.entries.forEach((entry: any) => {
        entries.push({
          Path: entry.Path,
          PID: entry.PID,
          Type: entry.Type,
          IRPOperation: entry.IRPOperation,
          Timestamp: entry.Timestamp,
          Size: entry.Size,
          GID: entry.GID,
          Metadata: entry.Metadata,
          process_name: entry.process_name,
          process_path: entry.process_path
        });
      });
    });
  }
  
  return entries;
};

// Initialize column helper
const columnHelper = createMRTColumnHelper<DataRow>();

// Define columns for "Show Unique" mode
const columnsUnique = [
  columnHelper.accessor('changes', {
    header: 'Events',
    size: 50,
    Cell: ({ cell }) => cell.getValue<number>(),
  }),
  columnHelper.accessor('Path', {
    header: 'Path',
    size: 400,
    Cell: ({ cell }) => <CustomCell value={cell.getValue<string>()} actions={filePathActions} />,
  }),
  columnHelper.accessor('Timestamp', {
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

  columnHelper.accessor('Path', {
    header: 'Path',
    maxSize: 400,
    Cell: ({ cell }) => 
      <Box sx={{ 
        maxWidth: '400px',
        overflow: 'visible',
        whiteSpace: 'normal', 
        wordWrap: 'break-word'
      }}>
    <CustomCell value={cell.getValue<string>()} actions={filePathActions} />
      </Box>
  }),
  columnHelper.accessor('PID', {
    header: 'PID',
    size: 0,
  }),
  columnHelper.accessor('process_name', {
    header: 'Process',
    size: 0,
    Cell: ({ cell, row }) => (
      <CustomCell 
        value={cell.getValue<string>()}
        actions={processActions}
        actionValue={{
          pid: Number(row.original.PID),
          name: String(row.original.process_name),
          path: String(row.original.process_path),
        }}
      />
    )
  }),
  columnHelper.accessor('process_path', {
    header: 'Process Path',
    size: 0,
  }),
  columnHelper.accessor('Type', {
    header: 'Type',
    size: 0,
  }),
  
  columnHelper.accessor('IRPOperation', {
    header: 'I/O',
    size: 0,
  }),
  columnHelper.accessor('Size', {
    header: 'Size',
    size: 0,
    Cell: ({ cell }) => `${cell.getValue<string>()}`,
  }),
  columnHelper.accessor('Timestamp', {
    header: 'Timestamp',
    size: 0,
    Cell: ({ cell }) => {
      const timestamp = cell.getValue<string>();
      const date = new Date(timestamp);
      const localDate = date.toLocaleDateString(undefined, {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric'
      });
      const time = date.toLocaleTimeString().split(' ')[0]; 
      const period = date.toLocaleTimeString().split(' ')[1];
      const ms = timestamp.split('.')[1].slice(0,3);
      return `${localDate}, ${time}.${ms} ${period}`;
    },
  }),
  columnHelper.accessor('GID', {
    header: 'GID',
    size: 0,
  }),
  
  columnHelper.accessor('Metadata', {
    header: 'Metadata',
    size: 300,
    Cell: ({ cell }) => {
      const metadata = cell.getValue<Record<string, string>>();
      return (
        <div>
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
      );
    },
  }),
];


interface MUITableProps {
  data: any[];
  darkMode?: boolean;
}

const MUITable: React.FC<MUITableProps> = ({ data, darkMode = true }) => {

  const [viewMode, setViewMode] = useState<'unique' | 'all' | 'directories'>('directories');
  const [rowSelectionMain, setRowSelectionMain] = useState<{ [key: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWatcherPaths, setSelectedWatcherPaths] = useState<string[]>([]);
  const [rowSelectionModal, setRowSelectionModal] = useState<{ [key: string]: boolean }>({});

  // Create custom theme
  const theme = useMemo(
    () => createAppTheme({ darkMode }),
    [darkMode]
  );

  // Parse data based on view mode
  const parsedData = useMemo(() => {
    switch (viewMode) {
      case 'unique':
        return parseBackendDataUnique(data);
      case 'all':
        return parseBackendDataAll(data);
      case 'directories':
        return parseBackendDataDirectories(data);
      default:
        return [];
    }
  }, [data, viewMode]);

  // Select appropriate columns based on view mode
  const columns = useMemo(() => {
    switch (viewMode) {
      case 'unique':
        return columnsUnique;
      case 'all':
        return columnsAll;
      case 'directories':
        return columnsDirectories;
      default:
        return [];
    }
  }, [viewMode]);


  
  // Separate export functions for different data types
  const handleExportRowsDirectory = (rows: MRT_Row<DirectoryData>[]) => {
    const rowData = rows.map((row) => ({
      Directory_Path: row.original.watcherPath,
      Total_Changes: row.original.changeCount,
      Last_Modified: new Date(row.original.Timestamp).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'medium',
      })
    }));
    
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };
  
  const handleExportRowsData = (rows: MRT_Row<DataRow>[]) => {
    if (viewMode === 'all') {
      const flattenedData = rows.map(row => ({
        Path: row.original.Path,
        PID: row.original.PID,
        Type: row.original.Type,
        IRPOperation: row.original.IRPOperation,
        Timestamp: new Date(row.original.Timestamp).toLocaleString(undefined, {
          dateStyle: 'short',
          timeStyle: 'medium',
        }),
        Size: row.original.Size,
        GID: row.original.GID,
        process_name: row.original.process_name,
        process_path: row.original.process_path,
        ...(row.original.Metadata && {
          Metadata: Object.entries(row.original.Metadata)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ')
        })
      }));
      const csv = generateCsv(csvConfig)(flattenedData);
      download(csvConfig)(csv);
    } else {
      const rowData = rows.map((row) => row.original);
      const csv = generateCsv(csvConfig)(rowData);
      download(csvConfig)(csv);
    }
  };
  // Main export function that handles both types
// Main export function that handles both types
const handleExportData = () => {
  if (viewMode === 'directories') {
    const directoryData = (parsedData as DirectoryData[]).map(item => ({
      Directory_Path: item.watcherPath,
      Total_Changes: item.changeCount,
      Last_Modified: new Date(item.Timestamp).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'medium',
      })
    }));
    const csv = generateCsv(csvConfig)(directoryData);
    download(csvConfig)(csv);
  } else if (viewMode === 'all') {
    // Flatten the data for 'all' view mode
    const flattenedData = (parsedData as DataRow[]).map(item => ({
      Path: item.Path,
      PID: item.PID,
      Type: item.Type,
      IRPOperation: item.IRPOperation,
      Timestamp: new Date(item.Timestamp).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'medium',
      }),
      Size: item.Size,
      GID: item.GID,
      process_name: item.process_name,
      process_path: item.process_path,
      // Convert Metadata object to string or exclude it
      ...(item.Metadata && {
        Metadata: Object.entries(item.Metadata)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ')
      })
    }));
    const csv = generateCsv(csvConfig)(flattenedData);
    download(csvConfig)(csv);
  } else {
    const csv = generateCsv(csvConfig)(parsedData as DataRow[]);
    download(csvConfig)(csv);
  }
};


  // Function to handle "View Changes" button click
  const handleViewChanges = () => {
    const selectedRows = mainTable.getSelectedRowModel().rows;
    if (viewMode === 'directories') {
      const paths = selectedRows.map((row) => row.original.watcherPath);
      setSelectedWatcherPaths(paths);
    } else {
      const paths = selectedRows.map((row) => row.original.Path);
      setSelectedWatcherPaths(paths);
    }
    setRowSelectionModal({});
    setIsModalOpen(true);
  };
  // Function to retrieve entries for specific paths
  const getEntriesForPaths = (backendData: any[], paths: string[]): DataRow[] => {
    const entries: DataRow[] = [];
    backendData.forEach((watcher) => {
      watcher.files.forEach((file: any) => {
        if (paths.includes(file.Path)) {
          file.entries.forEach((entry: any) => {
            entries.push({
              Path: entry.Path,
              PID: entry.PID,
              Type: entry.Type,
              IRPOperation: entry.IRPOperation,
              Timestamp: entry.Timestamp,
              Size: entry.Size,
              GID: entry.GID,
              Metadata: entry.Metadata,
              process_name: entry.process_name,
              process_path: entry.process_path
            });
          });
        }
      });
    });
    return entries;
  };

  // Compute modal data based on selected paths and main data
  const modalData = useMemo(() => {
    if (!isModalOpen || selectedWatcherPaths.length === 0) {
      return [];
    }
    
    if (viewMode === 'directories') {
      // Combine all entries from selected watchers
      return selectedWatcherPaths.flatMap(watcherPath => 
        getEntriesForWatcher(data, watcherPath)
      );
    } else {
      // Use existing logic for unique mode
      return getEntriesForPaths(data, selectedWatcherPaths);
    }
  }, [data, selectedWatcherPaths, isModalOpen, viewMode]);

  // Initialize main table instance
  const mainTable = useMaterialReactTable<any>({
    columns,
    data: parsedData,
    enableRowSelection: true,
    state: { 
      rowSelection: rowSelectionMain,
      columnOrder: viewMode === 'directories' 
        ? ['mrt-row-select', 'changeCount', 'watcherPath', 'Timestamp']
        : viewMode === 'unique'
        ? ['mrt-row-select', 'changes', 'Path', 'Timestamp']
        : ['mrt-row-select', 'Path', 'Type', 'IRPOperation', 'PID', 'process_name', 'process_path', 'Size', 'Timestamp', 'GID', 'Metadata'],
    },
    onRowSelectionChange: setRowSelectionMain,
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: '16px', padding: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="view-mode-select-label">View Mode</InputLabel>
          <Select
            labelId="view-mode-select-label"
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value as 'unique' | 'all' | 'directories');
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
            <MenuItem value="unique">Files</MenuItem>
            <MenuItem value="all">All Events</MenuItem>
            <MenuItem value="directories">Directories</MenuItem>
          </Select>
        </FormControl>

        <Button
          onClick={handleViewChanges}
          disabled={viewMode === 'all' || Object.keys(rowSelectionMain).length === 0}
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
          View Events
        </Button>

      <ExportButton 
        disabled={Object.keys(rowSelectionMain).length === 0}
        onClick={() => {
          if (viewMode === 'directories') {
            handleExportRowsDirectory(mainTable.getSelectedRowModel().rows as MRT_Row<DirectoryData>[]);
          } else {
            handleExportRowsData(mainTable.getSelectedRowModel().rows as MRT_Row<DataRow>[]);
          }
        }} 
        label="Export Selected" 
        darkMode={darkMode} 
      />
      <ExportButton 
        onClick={handleExportData} 
        label="Export All" 
        darkMode={darkMode} 
      />
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
      columnVisibility: {
        process_path: false,
        Metadata: false,
        GID: false,
      },
      sorting: [
        {
          id: 'Timestamp',
          desc: true
        }
      ],

    },
    muiTableBodyRowProps: () => ({
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
        '&:hover': {
          backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
        },
      },
    }),
    muiTableBodyCellProps: () => ({
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

  // Initialize modal table instance
  const modalTable = useMaterialReactTable<DataRow>({
    columns: columnsAll,
    data: modalData,
    enableRowSelection: true,
    state: { 
      rowSelection: rowSelectionModal,
      columnOrder: ['mrt-row-select', 'Path', 'PID', 'process_name', 'process_path', 'Type', 'IRPOperation', 'Size', 'Timestamp', 'GID', 'Metadata'],
    },
    onRowSelectionChange: setRowSelectionModal,
    columnFilterDisplayMode: 'popover',
    paginationDisplayMode: 'pages',
    positionToolbarAlertBanner: 'bottom',
    
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      columnVisibility: {
        process_path: false,
        Metadata: false,
        GID: false,
      },
      sorting: [
        {
          id: 'Timestamp',
          desc: true
        }
      ],

    },
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: '16px', padding: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <ExportButton 
          disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
          onClick={() => {
            const selectedRows = table.getSelectedRowModel().rows.map(row => ({
              Path: row.original.Path,
              PID: row.original.PID,
              Type: row.original.Type,
              IRPOperation: row.original.IRPOperation,
              Timestamp: new Date(row.original.Timestamp).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'medium',
              }),
              Size: row.original.Size,
              GID: row.original.GID,
              process_name: row.original.process_name,
              process_path: row.original.process_path,
              Metadata: row.original.Metadata ? Object.entries(row.original.Metadata)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ') : ''
            }));
            const csv = generateCsv(csvConfig)(selectedRows);
            download(csvConfig)(csv);
          }}
        label="Export Selected" 
        darkMode={darkMode} 
      />
        <ExportButton 
          onClick={() => {
            const allRows = table.getRowModel().rows.map(row => ({
              Path: row.original.Path,
              PID: row.original.PID,
              Type: row.original.Type,
              IRPOperation: row.original.IRPOperation,
              Timestamp: new Date(row.original.Timestamp).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'medium',
              }),
              Size: row.original.Size,
              GID: row.original.GID,
              process_name: row.original.process_name,
              process_path: row.original.process_path,
              Metadata: row.original.Metadata ? Object.entries(row.original.Metadata)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ') : ''
            }));
            const csv = generateCsv(csvConfig)(allRows);
            download(csvConfig)(csv);
          }}
        label="Export All" 
        darkMode={darkMode} 
      />
      </Box>
    ),
    muiTablePaperProps: {
      sx: {
        borderRadius: '.5rem',
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
      },
    },
    muiTableBodyRowProps: () => ({
      sx: {
        backgroundColor: darkMode ? DARK_PRIMARY : '#ffffff',
        '&:hover': {
          backgroundColor: darkMode ? DARK_PRIMARY_HOVER : '#f5f5f5',
        },
      },
    }),
    muiTableBodyCellProps: () => ({
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

  return (
    <ThemeProvider theme={theme}>
      <MaterialReactTable table={mainTable} />

      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setRowSelectionModal({});
        }}
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
          color: darkMode ? DARK_TEXT_GREEN : '#000000',
          fontWeight: '600'
        }}
        >Expanded Modifications</DialogTitle>
        <DialogContent>
          <MaterialReactTable table={modalTable} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default MUITable;