// src/App.tsx

import React from 'react';
import { Container, Typography } from '@mui/material';
import JsonViewer from '../components/JsonViewer';

const sampleJson = [
  {
      "Watcher": "C:\\example",
      "files": [
          {
              "Path": "C:\\example\\ExampleFile.txt",
              "PID": "*",
              "Type": "*",
              "Timestamp": "2024-10-03 16:51:00",
              "Changes": 3,
              "Size": "*",
              "entries": [
                  {
                      "Path": "C:\\example\\ExampleFile.txt",
                      "PID": "N/A",
                      "Type": "Modified",
                      "Timestamp": "2024-10-03 16:50:56",
                      "Size": "3 bytes"
                  },
                  {
                      "Path": "C:\\example\\ExampleFile.txt",
                      "PID": "N/A",
                      "Type": "Modified",
                      "Timestamp": "2024-10-03 16:50:58",
                      "Size": "12 bytes"
                  },
                  {
                      "Path": "C:\\example\\ExampleFile.txt",
                      "PID": "N/A",
                      "Type": "Modified",
                      "Timestamp": "2024-10-03 16:51:00",
                      "Size": "21 bytes"
                  }
              ]
          }
      ]
  }
];


const Saved: React.FC = () => {
  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        JSON Viewer
      </Typography>
      
      <JsonViewer json={sampleJson} />

    </Container>
  );
};

export default Saved;
