import { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/api/dialog';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  // State variables to manage directories and file changes
  const [directories, setDirectories] = useState<string[]>([]);
  const [fileChanges, setFileChanges] = useState<Record<string, Record<string, number>>>({});
  const [fileDetails, setFileDetails] = useState<
    Record<string, Record<string, Record<string, string>>>
  >({}); // Nested records to store metadata

  // Refs for scrolling behavior
  const listRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const autoScrollEnabled = useRef<{ [key: string]: boolean }>({});

  const scrollBottomBuffer = 60;
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  // Function to show a throttled toast message
  const showThrottledToast = (message: string) => {
    if (toastTimeout.current) return; // If there's already a toast scheduled, don't show a new one
    toast.info(message);
    toastTimeout.current = setTimeout(() => {
      toastTimeout.current = null;
    }, 2000);
  };

  // Effect to set up the listener for file change events
  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen('file-change-event', (event) => {
        const change = event.payload as string;

        // Split the event string into lines
        const [eventKindAndPath, ...rest] = change.split('\n');
        const [, filePath] = eventKindAndPath.split(': ');

        const fileInfo = rest.join('\n');

        // Parse the fileInfo string into key-value pairs
        const metadataEntries = fileInfo.split(', ').map((entry) => entry.split(': '));
        const metadata = Object.fromEntries(metadataEntries);

        setFileChanges((prevChanges) => {
          const dir = directories.find((directory) => filePath.includes(directory));
          if (dir) {
            const updatedChanges = { ...prevChanges[dir] };
            updatedChanges[filePath] = (updatedChanges[filePath] || 0) + 1;

            // Update file details with the latest metadata
            setFileDetails((prevDetails) => {
              const updatedDetails = { ...prevDetails[dir] };
              updatedDetails[filePath] = metadata;
              return { ...prevDetails, [dir]: updatedDetails };
            });

            // Show a toast notification every 100 changes
            if (updatedChanges[filePath] % 100 === 0) {
              showThrottledToast(
                `File ${filePath} has been modified ${updatedChanges[filePath]} times`
              );
            }

            return {
              ...prevChanges,
              [dir]: updatedChanges,
            };
          }
          return prevChanges;
        });
      });

      return () => {
        unlisten();
      };
    };

    setupListener();
  }, [directories]);

  // Effect to handle auto-scrolling behavior
  useEffect(() => {
    directories.forEach((dir) => {
      const box = listRefs.current[dir];
      if (box && autoScrollEnabled.current[dir]) {
        box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
      }
    });
  }, [fileChanges, directories]);

  // Handler for scroll events to toggle auto-scrolling
  const handleScroll = (dir: string) => {
    const box = listRefs.current[dir];
    if (box) {
      const isAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight <= scrollBottomBuffer;
      autoScrollEnabled.current[dir] = isAtBottom;
    }
  };

  // Handler to sort file changes by the number of changes
  const handleSort = () => {
    const sortedChanges = { ...fileChanges };
    Object.keys(sortedChanges).forEach((dir) => {
      const changes = Object.entries(sortedChanges[dir]);
      const sorted = changes.sort(([, countA], [, countB]) => countB - countA);
      sortedChanges[dir] = Object.fromEntries(sorted);
    });

    setFileChanges(sortedChanges);
    toast.success('Sorted by most changes');
  };

  // Handler to start monitoring the selected directories
  const handleStartMonitoring = async () => {
    try {
      await invoke('start_monitoring', { directories });
      toast.success('Started monitoring directories');
    } catch (error) {
      console.error('Error starting monitoring:', error);
      toast.error('Failed to start monitoring');
    }
  };

  // Handler to add a directory to monitor
  const handleAddDirectory = async () => {
    try {
      const selectedDirectory = await open({
        directory: true,
        multiple: false,
      });

      if (selectedDirectory) {
        setDirectories((prev) => [...prev, selectedDirectory as string]);
        autoScrollEnabled.current[selectedDirectory as string] = true;
        toast.success(`Added directory: ${selectedDirectory}`);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      toast.error('Failed to add directory');
    }
  };

  // Handler to clear all monitored directories and reset state
  const handleClearDirectories = () => {
    setDirectories([]);
    setFileChanges({});
    setFileDetails({});
    toast.info('Directories cleared');
  };

  // Function to render metadata tooltips
  const renderMetadataTooltip = (dir: string, change: string): React.ReactElement => {
    const metadata = fileDetails[dir]?.[change] || {};

    const metadataFields = [
      'Size',
      'Created',
      'Modified',
      'Accessed',
      'Readonly',
      'IsHidden',
      'IsTemporary',
      'IsEncrypted',
    ];

    return (
      <Typography sx={{ fontSize: '1.2rem', color: 'cyan' }}>
        {metadataFields.map((key) => (
          <div key={key}>{`${key}: ${metadata[key] || 'Unknown'}`}</div>
        ))}
      </Typography>
    );
  };

  return (
    <div>
      {/* Application Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            File Modification Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, maxWidth: '100%', pl: 0, pr: 0, ml: 0 }}>
        {/* Control Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'row', mb: 2, gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button variant="contained" color="primary" onClick={handleAddDirectory}>
              Add Directory
            </Button>
            <Button variant="contained" color="error" onClick={handleClearDirectories}>
              Clear Directories
            </Button>
          </Box>

          <Button variant="contained" color="info" onClick={handleSort}>
            Sort by Most Changes
          </Button>

          <Box sx={{ width: 20 }}></Box>

          <Button variant="contained" color="secondary" onClick={handleStartMonitoring}>
            Start Monitoring
          </Button>
        </Box>

        {/* Display File Changes */}
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
          File Changes by Directory:
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: '20px' }}>
          {directories.map((dir) => (
            <Box key={dir} sx={{ width: '100%', maxWidth: '100%', flexWrap: 'nowrap' }}>
              <Box
                sx={{
                  border: '1px solid gray',
                  padding: 2,
                  maxHeight: 600,
                  overflowY: 'scroll',
                  minWidth: '400px',
                  overflowX: 'hidden',
                }}
                ref={(el) => {
                  listRefs.current[dir] = el as HTMLDivElement | null;
                }}
                onScroll={() => handleScroll(dir)}
              >
                <Typography variant="h6">{dir}</Typography>
                <TableContainer component={Paper} sx={{ backgroundColor: 'black' }}>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#00ff00' }}>Count</TableCell>
                          <TableCell sx={{ color: '#00ff00' }}>File Change</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(fileChanges[dir] || {}).map(([change, count], index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ color: '#00ff00' }}>{count}</TableCell>
                            <Tooltip title={renderMetadataTooltip(dir, change)}>
                              <TableCell sx={{ color: '#00ff00' }}>{change}</TableCell>
                            </Tooltip>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </motion.div>
                </TableContainer>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
      <ToastContainer />
    </div>
  );
}

export default App;
