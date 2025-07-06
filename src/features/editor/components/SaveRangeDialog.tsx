// src/features/editor/components/SaveRangeDialog.tsx
'use client';

import React, { useState } from 'react';
import { useRangeStore } from '@/store/rangeStore';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';

export const SaveRangeDialog = () => {
  const { isSaveDialogOpen, closeSaveDialog, saveRange } = useRangeStore();
  const [rangeName, setRangeName] = useState('');

  const handleSave = () => {
    saveRange(rangeName);
    setRangeName(''); // Reset name after saving
  };

  return (
    <Dialog open={isSaveDialogOpen} onClose={closeSaveDialog}>
      <DialogTitle>Sauvegarder le Range</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Nom du Range"
          type="text"
          fullWidth
          variant="standard"
          value={rangeName}
          onChange={(e) => setRangeName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeSaveDialog}>Annuler</Button>
        <Button onClick={handleSave} disabled={!rangeName.trim()}>
          Sauvegarder
        </Button>
      </DialogActions>
    </Dialog>
  );
};