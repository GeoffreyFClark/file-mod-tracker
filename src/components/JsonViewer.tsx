// src/components/JsonViewer.tsx

import React, { useState } from 'react';
import { Paper, Typography, IconButton, Tooltip, Box } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface JsonViewerProps {
  json: object | string;
  maxHeight?: string; // Optional prop to set maximum height
}

const JsonViewer: React.FC<JsonViewerProps> = ({ json, maxHeight = '800px' }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  let formattedJson = '';

  // Format the JSON based on the input type
  if (typeof json === 'string') {
    try {
      const parsed = JSON.parse(json);
      formattedJson = JSON.stringify(parsed, null, 2);
    } catch (error) {
      // If parsing fails, display the original string
      formattedJson = json;
    }
  } else if (typeof json === 'object') {
    formattedJson = JSON.stringify(json, null, 2);
  } else {
    formattedJson = String(json);
  }

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'relative',
        padding: 2,
        backgroundColor: '#F6F6F6',
        overflow: 'auto',
        maxHeight: maxHeight,
      }}
    >
      {/* Copy Button */}
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <Tooltip title={copySuccess ? 'Copied!' : 'Copy to clipboard'}>
          <IconButton onClick={handleCopy} size="small">
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Display JSON with Syntax Highlighting */}
      <SyntaxHighlighter language="json" style={github} customStyle={{ margin: 0 }}>
        {formattedJson}
      </SyntaxHighlighter>

    </Paper>
  );
};

export default JsonViewer;
