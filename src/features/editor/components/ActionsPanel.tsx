// src/features/editor/components/ActionsPanel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRangeStore } from '@/store/rangeStore';
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
  Popper, // <-- Importer Popper
} from '@mui/material';
import {
  DEFAULT_IMPLICIT_ACTION_ID,
  DEFAULT_TEXT_COLOR,
  DEFAULT_EMPTY_HAND_COLOR,
  Action,
} from '@/lib/constants';
import AddIcon from '@mui/icons-material/Add';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CloseIcon from '@mui/icons-material/Close';
import dynamic from 'next/dynamic';

const DynamicColorPicker = dynamic(() => import('react-colorful').then(mod => mod.HexColorPicker), {
  ssr: false,
});

export const ActionsPanel = () => {
  const {
    customActions, activeActionId, activeFrequency,
    setActiveActionId, addCustomAction, updateCustomAction, deleteCustomAction,
  } = useRangeStore();

  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [tempEditedName, setTempEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Nouvel état pour l'ancre du Popper
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

  // On passe maintenant l'événement pour récupérer l'élément cliqué (l'ancre)
  const handleColorClick = (event: React.MouseEvent<HTMLElement>, action: Action) => {
    setAnchorEl(event.currentTarget);
    setEditingColorId(action.id);
  };

  const handleColorPickerClose = () => {
    setAnchorEl(null);
    setEditingColorId(null);
  };

  return (
    <Paper elevation={3} sx={{ width: { xs: '100%', md: '300px' }, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" gutterBottom>Actions de Range</Typography>
      <Divider sx={{ my: 1 }} />

      <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
        {customActions.map(action => (
          <ListItem key={action.id} disablePadding sx={{ backgroundColor: activeActionId === action.id ? 'action.selected' : 'transparent' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', p: 1 }}>
              <IconButton onClick={() => setActiveActionId(action.id === activeActionId ? '' : action.id)} size="small" sx={{ mr: 1 }}>
                {activeActionId === action.id ? <RadioButtonCheckedIcon color="primary" /> : <RadioButtonUncheckedIcon />}
              </IconButton>
              
              <Tooltip title="Changer la couleur" arrow>
                <span>
                  <Button
                    sx={{ minWidth: '36px', height: '36px', backgroundColor: action.color, '&:hover': { backgroundColor: action.color, opacity: 0.8 } }}
                    onClick={(e) => handleColorClick(e, action)}
                  />
                </span>
              </Tooltip>

              {/* Le ColorPicker n'est PLUS rendu ici */}

              {editingNameId === action.id ? (
                <TextField
                  inputRef={nameInputRef} value={tempEditedName} onChange={(e) => setTempEditedName(e.target.value)}
                  onBlur={() => handleNameBlur(action.id)} onKeyPress={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  /* ... autres props ... */
                />
              ) : (
                <Typography onClick={() => { if (action.id !== DEFAULT_IMPLICIT_ACTION_ID) { setEditingNameId(action.id); setTempEditedName(action.name); } }}>
                  {action.name}
                </Typography>
              )}

              <IconButton edge="end" onClick={() => deleteCustomAction(action.id)} disabled={action.id === DEFAULT_IMPLICIT_ACTION_ID}>
                <CloseIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>
      
      {/* Le Popper est rendu ici, EN DEHORS de la liste */}
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

      {/* ... Le reste du composant (Chip, etc.) ... */}
    </Paper>
  );
};