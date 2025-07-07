// src/features/editor/components/RangeLibraryItem.tsx
'use client';

import React from 'react';
import { ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface RangeItem {
  id: string;
  name: string;
  createdAt: number;
}

interface RangeLibraryItemProps {
  range: RangeItem;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export const RangeLibraryItem = ({ range, onLoad, onDelete }: RangeLibraryItemProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le chargement du range quand on clique sur supprimer
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la range "${range.name}" ?`)) {
      onDelete(range.id);
    }
  };

  return (
    <ListItem
      onClick={() => onLoad(range.id)}
      sx={{
        border: '1px solid #eee',
        borderRadius: '4px',
        mb: 1,
        '&:hover': { backgroundColor: 'action.hover', cursor: 'pointer' },
      }}
      secondaryAction={
        <IconButton edge="end" aria-label="delete" onClick={handleDelete}>
          <DeleteIcon />
        </IconButton>
      }
    >
      <ListItemText
        primary={range.name}
        secondary={`Créé le: ${new Date(range.createdAt).toLocaleDateString()}`}
      />
    </ListItem>
  );
};