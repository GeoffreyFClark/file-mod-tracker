// ExportButton.tsx
import React from 'react';
import { Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { createButtonStyles } from '../utils/tableStyles';

interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  darkMode?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onClick,
  disabled = false,
  label = 'Export',
  darkMode = true,
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    startIcon={<FileDownloadIcon />}
    sx={createButtonStyles(darkMode)}
  >
    {label}
  </Button>
);