// src/components/InsertRowDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { predefinedRows, DataRow } from '../data/rows';

interface InsertRowDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (row: DataRow) => void;
}

const InsertRowDialog: React.FC<InsertRowDialogProps> = ({ open, onClose, onInsert }) => {
  const [selectedPredefinedRow, setSelectedPredefinedRow] = useState<number | ''>('');

  const handleInsert = () => {
    if (selectedPredefinedRow !== '') {
      const newRow = { ...predefinedRows[selectedPredefinedRow], timestamp: new Date().toISOString() };
      onInsert(newRow);
      setSelectedPredefinedRow('');
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedPredefinedRow('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>Insert Predefined Row</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="dense">
          <InputLabel id="predefined-row-select-label">Select Predefined Row</InputLabel>
          <Select
            labelId="predefined-row-select-label"
            value={selectedPredefinedRow}
            label="Select Predefined Row"
            onChange={(e) => setSelectedPredefinedRow(e.target.value as number)}
          >
            {predefinedRows.map((row, index) => (
              <MenuItem key={index} value={index}>
                {row.path} - {row.details}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleInsert} disabled={selectedPredefinedRow === ''}>
          Insert
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InsertRowDialog;
