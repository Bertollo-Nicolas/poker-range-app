// src/features/editor/components/LoadRangeDialog.tsx
'use client';

import React from 'react';
import { useRangeStore } from '@/store/rangeStore';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export const LoadRangeDialog = () => {
  const {
    isLoadDialogOpen,
    closeLoadDialog,
    savedRanges,
    loadRange,
    deleteRange,
  } = useRangeStore();

  return (
    <Dialog open={isLoadDialogOpen} onClose={closeLoadDialog} fullWidth maxWidth="sm">
      <DialogTitle>Charger un Range</DialogTitle>
      <DialogContent dividers>
        {savedRanges.length === 0 ? (
          <Typography>Aucun range sauvegardé.</Typography>
        ) : (
          <List>
            {savedRanges.map((range) => (
              <ListItem
                key={range.id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => deleteRange(range.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
                sx={{ '&:hover': { backgroundColor: '#f5f5f5', cursor: 'pointer' } }}
                // --- La correction est ici ---
                onClick={() => loadRange(range.id)}
              >
                <ListItemText
                  primary={range.name}
                  secondary={`Créé le: ${new Date(range.createdAt).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeLoadDialog}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};