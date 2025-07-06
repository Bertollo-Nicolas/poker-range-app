// src/features/editor/components/MixedColorsPanel.tsx
'use client';

import React, { useState } from 'react';
import { useRangeStore, ActionMix } from '@/store/rangeStore';
import {
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  Button,
  Collapse,
  Slider,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';

// Petit composant pour afficher un carré de couleur
const ColorBox = ({ color }: { color: string }) => (
  <Box sx={{ width: 24, height: 24, backgroundColor: color, borderRadius: 1, border: '1px solid #ccc' }} />
);

export const MixedColorsPanel = () => {
  const {
    customActions,
    actionMixes,
    activeBrush,
    addActionMix,
    updateActionMix,
    deleteActionMix,
    setActiveBrush,
  } = useRangeStore();

  const [isOpen, setIsOpen] = useState(true);

  const handleActionChange = (mixId: string, actionIndex: number, newActionId: string) => {
    const mix = actionMixes.find(m => m.id === mixId);
    if (!mix) return;

    const newActions = [...mix.actions];
    newActions[actionIndex] = { actionId: newActionId };
    updateActionMix(mixId, { actions: newActions as any });
  };

  const addSecondAction = (mixId: string) => {
    const mix = actionMixes.find(m => m.id === mixId);
    if (!mix || mix.actions.length > 1) return;

    // Ajoute la deuxième action disponible qui n'est pas déjà utilisée
    const secondAction = customActions.find(a => a.id !== mix.actions[0].actionId);
    if (secondAction) {
      const newActions = [...mix.actions, { actionId: secondAction.id }];
      updateActionMix(mixId, { actions: newActions as any, frequency: 50 });
    }
  };

  const removeSecondAction = (mixId: string) => {
    const mix = actionMixes.find(m => m.id === mixId);
    if (!mix) return;
    const newActions = [mix.actions[0]];
    updateActionMix(mixId, { actions: newActions as any, frequency: 100 });
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
        <Typography variant="h6">Mixed colors</Typography>
        <IconButton size="small">{isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
      </Box>
      <Collapse in={isOpen}>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {actionMixes.map((mix) => {
            const firstAction = customActions.find(a => a.id === mix.actions[0]?.actionId);
            const secondAction = mix.actions[1] ? customActions.find(a => a.id === mix.actions[1]?.actionId) : null;

            return (
              <Paper key={mix.id} variant="outlined" sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={() => setActiveBrush({ type: 'mix', id: mix.id })}>
                    {activeBrush?.type === 'mix' && activeBrush.id === mix.id ? <RadioButtonCheckedIcon color="primary" /> : <RadioButtonUncheckedIcon />}
                  </IconButton>
                  
                  {/* Sélecteur pour la première action */}
                  {firstAction && <ColorBox color={firstAction.color} />}
                  <FormControl size="small" variant="standard" sx={{ minWidth: 120 }}>
                     <Select value={firstAction?.id || ''} onChange={(e) => handleActionChange(mix.id, 0, e.target.value)}>
                        {customActions.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                     </Select>
                  </FormControl>

                  {/* Logique pour la deuxième action */}
                  {mix.actions.length > 1 && secondAction ? (
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
                        <ColorBox color={secondAction.color} />
                         <IconButton size="small" onClick={() => removeSecondAction(mix.id)} sx={{position: 'absolute', top: -12, right: -12, p: 0.2, backgroundColor: 'white', '&:hover': {backgroundColor: '#eee'}}}><CloseIcon fontSize="small" /></IconButton>
                     </Box>
                  ) : (
                    <Button size="small" onClick={() => addSecondAction(mix.id)} disabled={customActions.length < 2}>+ Action</Button>
                  )}

                  <IconButton size="small" onClick={() => deleteActionMix(mix.id)} sx={{ ml: 'auto' }}><DeleteIcon /></IconButton>
                </Box>
                
                {/* Slider de fréquence */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1 }}>
                   <Typography variant="body2" sx={{ minWidth: '40px' }}>{mix.frequency}%</Typography>
                   <Slider
                        value={mix.frequency}
                        onChange={(e, newValue) => updateActionMix(mix.id, { frequency: newValue as number })}
                        aria-labelledby="frequency-slider"
                        valueLabelDisplay="auto"
                        // On a simplement retiré la ligne "disabled"
                    />
                   <Typography variant="body2" sx={{ minWidth: '40px' }}>{100 - mix.frequency}%</Typography>
                </Box>
              </Paper>
            );
          })}
          <Button startIcon={<AddIcon />} onClick={addActionMix} fullWidth>Ajouter un mix</Button>
        </Box>
      </Collapse>
    </Paper>
  );
};