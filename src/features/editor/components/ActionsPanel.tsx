// src/features/editor/components/ActionsPanel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRangeStore } from '@/store/rangeStore';
import { Action } from '@/lib/constants';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Fade,
  TextField,
  Button,
  Chip,
  ClickAwayListener,
  Popper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CloseIcon from '@mui/icons-material/Close';
import dynamic from 'next/dynamic';

const DynamicColorPicker = dynamic(() => import('react-colorful').then(mod => mod.HexColorPicker), {
  ssr: false,
});

export const ActionsPanel = () => {
  // --- MISE À JOUR DE LA CONNEXION AU STORE ---
  const {
    customActions,
    activeBrush, // On utilise activeBrush
    setActiveBrush, // On utilise setActiveBrush
    addCustomAction,
    updateCustomAction,
    deleteCustomAction,
  } = useRangeStore();

  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [tempEditedName, setTempEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (editingNameId && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingNameId]);

  const handleAddAction = () => {
    const newActionId = addCustomAction();
    setEditingNameId(newActionId);
    setTempEditedName('Nouvelle Action');
  };

  const handleNameBlur = (actionId: string) => {
    updateCustomAction(actionId, { name: tempEditedName.trim() || 'Nom Action' });
    setEditingNameId(null);
  };
  
  const handleColorClick = (event: React.MouseEvent<HTMLElement>, action: Action) => {
    setAnchorEl(event.currentTarget);
    setEditingColorId(action.id);
  };

  const handleColorPickerClose = () => {
    setAnchorEl(null);
    setEditingColorId(null);
  };

  // --- MISE À JOUR DE LA LOGIQUE D'ACTIVATION ---
  const handleBrushSelect = (actionId: string) => {
    // Si on clique sur le pinceau déjà actif, on le désactive
    if (activeBrush?.type === 'simple' && activeBrush.id === actionId) {
        setActiveBrush(null);
    } else {
        // Sinon, on l'active
        setActiveBrush({ type: 'simple', id: actionId });
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" gutterBottom>Actions</Typography>
      <Divider sx={{ my: 1 }} />

      <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
        {customActions.map(action => {
          const isSelected = activeBrush?.type === 'simple' && activeBrush.id === action.id;
          return (
            <ListItem key={action.id} disablePadding sx={{ backgroundColor: isSelected ? 'action.selected' : 'transparent' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', p: 1 }}>
                <IconButton onClick={() => handleBrushSelect(action.id)} size="small" sx={{ mr: 1 }}>
                  {isSelected ? <RadioButtonCheckedIcon color="primary" /> : <RadioButtonUncheckedIcon />}
                </IconButton>
                
                <Tooltip title="Changer la couleur" arrow>
                  <span>
                    <Button
                      sx={{ minWidth: '36px', height: '36px', backgroundColor: action.color, '&:hover': { backgroundColor: action.color, opacity: 0.8 } }}
                      onClick={(e) => handleColorClick(e, action)}
                    />
                  </span>
                </Tooltip>

                {editingNameId === action.id ? (
                  <TextField
                    inputRef={nameInputRef} value={tempEditedName} onChange={(e) => setTempEditedName(e.target.value)}
                    onBlur={() => handleNameBlur(action.id)} onKeyPress={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  />
                ) : (
                  <Typography onClick={() => { setEditingNameId(action.id); setTempEditedName(action.name); }} sx={{ flexGrow: 1, ml: 1, cursor: 'pointer' }}>
                    {action.name}
                  </Typography>
                )}

                <IconButton edge="end" onClick={() => deleteCustomAction(action.id)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </ListItem>
          );
        })}
      </List>
      
      <Popper open={Boolean(editingColorId)} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1200 }}>
        <ClickAwayListener onClickAway={handleColorPickerClose}>
          <Paper elevation={5}>
            <DynamicColorPicker
              color={customActions.find(a => a.id === editingColorId)?.color || '#000'}
              onChange={(color) => { if (editingColorId) { updateCustomAction(editingColorId, { color }); } }}
            />
          </Paper>
        </ClickAwayListener>
      </Popper>

      <Button onClick={handleAddAction} variant="outlined" fullWidth startIcon={<AddIcon />}>
        Ajouter Action
      </Button>
    </Paper>
  );
};