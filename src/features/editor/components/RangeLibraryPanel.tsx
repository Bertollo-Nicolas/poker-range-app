// src/features/editor/components/RangeLibraryPanel.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRangeStore } from '@/store/rangeStore';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  TextField,
  IconButton,
} from '@mui/material';
import { TreeItemComponent } from './TreeItemComponent';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export const RangeLibraryPanel = () => {
  const { rangeTree, addFolder, addRange, moveItem, setSelectedItem } = useRangeStore();
  const sensors = useSensors(useSensor(PointerSensor));

  const [isCreating, setIsCreating] = useState<'folder' | 'range' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // On récupère "isOver" pour le retour visuel de la zone de dépôt
  const { setNodeRef, isOver } = useDroppable({ id: 'root-drop-zone' });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    const overId = over?.id === 'root-drop-zone' || !over ? null : over.id;

    if (active.id !== overId) {
      moveItem(active.id, overId);
    }
  };

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleStartCreation = (type: 'folder' | 'range') => {
    setIsCreating(type);
    setNewItemName(''); // <-- On met une chaîne vide ici
  };

  const handleCancelCreation = () => {
    setIsCreating(null);
    setNewItemName('');
  };

  const handleConfirmCreation = () => {
    if (!newItemName.trim()) return;

    if (isCreating === 'folder') {
      addFolder(newItemName);
    } else if (isCreating === 'range') {
      addRange(newItemName);
    }
    handleCancelCreation();
  };

  return (
    <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6">Bibliothèque</Typography>
      <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
        <Button size="small" variant="outlined" startIcon={<CreateNewFolderIcon />} onClick={() => handleStartCreation('folder')}>
          Dossier
        </Button>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => handleStartCreation('range')}>
          Range
        </Button>
      </Box>
      <Divider sx={{ mb: 1 }} />

      {/* Ce Box est le conteneur principal ET la zone de dépôt pour la racine */}
      <Box
        ref={setNodeRef}
        onClick={() => setSelectedItem(null)}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 1, // Padding interne pour l'espacement
          borderRadius: 1,
          transition: 'background-color 0.2s ease-in-out',
          // Retour visuel quand on survole la zone avec un item
          backgroundColor: isOver ? 'action.hover' : 'transparent',
        }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rangeTree.map(item => item.id)} strategy={verticalListSortingStrategy}>
            
            {/* Interface de création */}
            {isCreating && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, backgroundColor: 'action.selected', borderRadius: 1 }}>
                <TextField
                  inputRef={inputRef}
                  variant="standard"
                  size="small"
                  fullWidth
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleConfirmCreation()}
                />
                <IconButton color="success" size="small" onClick={handleConfirmCreation}><CheckIcon /></IconButton>
                <IconButton color="error" size="small" onClick={handleCancelCreation}><CloseIcon /></IconButton>
              </Box>
            )}

            {/* Arborescence des ranges */}
            {rangeTree.length === 0 && !isCreating ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4, p: 2 }}>
                La bibliothèque est vide.
                <br />
                Déposez un élément ici pour l'ajouter à la racine.
              </Typography>
            ) : (
              rangeTree.map(item => (
                <div key={item.id} onClick={(e) => e.stopPropagation()}>
                  <TreeItemComponent item={item} level={0} />
                </div>
              ))
            )}
          </SortableContext>
        </DndContext>
      </Box>
    </Paper>
  );
};