// src/app/editor/page.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Toolbar,
  Button,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Chip,
  Fade,
  Paper,
  Divider,
  ClickAwayListener,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CloseIcon from '@mui/icons-material/Close';

import dynamic from 'next/dynamic';

import {
  DEFAULT_ACTION_PALETTE,
  DEFAULT_IMPLICIT_ACTION_ID,
  getColorForAction,
  Action,
  DEFAULT_TEXT_COLOR,
  DEFAULT_EMPTY_HAND_COLOR
} from '@/lib/constants';
import { getAllHandNotations } from '@/features/editor/utils/handUtils';


const DynamicColorPicker = dynamic(() => import('react-colorful').then(mod => mod.HexColorPicker), {
  ssr: false,
});

const DynamicPokerGrid = dynamic(
  () => import('@/features/editor/components/PokerGrid'),
  { ssr: false }
);

interface HandFrequency {
  actionId: string;
  frequency: number;
}

interface SavedRange {
  id: string;
  name: string;
  handFrequencies: Array<[string, HandFrequency[]]>; // Correctement un tableau pour la sérialisation JSON
  customActions: Action[];
  createdAt: number;
}

// Helper function to ensure 'Fold' action is always present
const ensureFoldAction = (actions: Action[]): Action[] => {
  const foldAction = DEFAULT_ACTION_PALETTE.find(a => a.id === DEFAULT_IMPLICIT_ACTION_ID)!;
  if (!actions.some(a => a.id === DEFAULT_IMPLICIT_ACTION_ID)) {
    return [...actions, foldAction];
  }
  return actions;
};

export default function EditorPage() {
  const [handFrequencies, setHandFrequencies] = useState<Map<string, HandFrequency[]>>(() => new Map());

  const [customActions, setCustomActions] = useState<Action[]>(() => {
    try {
      const storedActions = localStorage.getItem('defaultCustomActions');
      const loadedActions: Action[] = storedActions ? JSON.parse(storedActions) : [];
      return ensureFoldAction(loadedActions);
    } catch (error) {
      console.error("Failed to load default custom actions:", error);
      return ensureFoldAction([]);
    }
  });

  const [activeActionId, setActiveActionId] = useState<string>('');
  const [activeFrequency, setActiveFrequency] = useState<number>(100);

  const [savedRanges, setSavedRanges] = useState<SavedRange[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newRangeName, setNewRangeName] = useState('');
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [tempEditedName, setTempEditedName] = useState('');
  const [tempEditedColor, setTempEditedColor] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    try {
      const storedRanges = localStorage.getItem('pokerRanges');
      if (storedRanges) {
        const parsedRanges: SavedRange[] = JSON.parse(storedRanges);
        const normalizedRanges = parsedRanges.map(range => {
          let normalizedHandFrequenciesMap: Map<string, HandFrequency[]> = new Map();
          if ((range as any).actions) { // Handle old format: Array<[string, string]>
            Array.from(new Map((range as any).actions).entries()).forEach(([notation, actionId]) => {
              normalizedHandFrequenciesMap.set(notation, [{ actionId: actionId, frequency: 100 }]);
            });
          } else if (range.handFrequencies) { // New format: Array<[string, HandFrequency[]]> (JSON array)
            normalizedHandFrequenciesMap = new Map(range.handFrequencies); // Convert array to Map
          }

          const loadedCustomActions = ensureFoldAction(range.customActions || []);

          return {
            ...range,
            // Pour l'interface SavedRange (qui est un tableau), on reconvertit en tableau ici
            handFrequencies: Array.from(normalizedHandFrequenciesMap.entries()),
            customActions: loadedCustomActions,
          };
        }); // Removed 'as SavedRange[]' here to let TS infer based on return

        setSavedRanges(normalizedRanges.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (error) {
      console.error("Failed to load ranges from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const actionsToSave = customActions.filter(a => a.id !== DEFAULT_IMPLICIT_ACTION_ID);
      localStorage.setItem('defaultCustomActions', JSON.stringify(actionsToSave));
    } catch (error) {
      console.error("Failed to save default custom actions:", error);
    }
  }, [customActions]);

  useEffect(() => {
    if (editingNameId && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingNameId]);


  const updateLocalStorageRanges = useCallback((updatedRanges: SavedRange[]) => {
    try {
      localStorage.setItem('pokerRanges', JSON.stringify(updatedRanges));
    } catch (error) {
      console.error("Failed to update ranges in localStorage:", error);
      alert("Erreur lors de la mise à jour des ranges. Veuillez réessayer.");
    }
  }, []);

  const resetGridActions = useCallback(() => {
    setHandFrequencies(new Map());
  }, []);

  const handleSaveClick = useCallback(() => {
    setNewRangeName('');
    setSaveDialogOpen(true);
  }, []);

  const saveCurrentRange = useCallback(() => {
    if (!newRangeName.trim()) {
      alert('Veuillez donner un nom à votre range.');
      return;
    }

    const allHands = getAllHandNotations();
    const frequenciesToSave: Array<[string, HandFrequency[]]> = [];

    allHands.forEach(hand => {
      const handFreqs = handFrequencies.get(hand); // handFreqs est un HandFrequency[] ou undefined
      if (handFreqs && handFreqs.length > 0) {
        // Corrected: use handFreqs.length instead of freqs.length
        const filteredFreqs = handFreqs.filter(hf => hf.frequency > 0 && !(hf.actionId === DEFAULT_IMPLICIT_ACTION_ID && hf.frequency === 100 && handFreqs.length === 1));
        if (filteredFreqs.length > 0) {
          frequenciesToSave.push([hand, filteredFreqs]);
        }
      }
    });

    const newRange: SavedRange = {
      id: Date.now().toString(),
      name: newRangeName.trim(),
      handFrequencies: frequenciesToSave,
      customActions: customActions.filter(a => a.id !== DEFAULT_IMPLICIT_ACTION_ID),
      createdAt: Date.now(),
    };

    setSavedRanges(prevRanges => {
      const updatedRanges = [...prevRanges, newRange].sort((a, b) => b.createdAt - a.createdAt);
      updateLocalStorageRanges(updatedRanges);
      alert(`Range "${newRange.name}" sauvegardé avec succès !`);
      return updatedRanges;
    });

    setSaveDialogOpen(false);
  }, [newRangeName, handFrequencies, customActions, updateLocalStorageRanges]);

  const loadRange = useCallback((rangeToLoad: SavedRange) => {
    // rangeToLoad.handFrequencies est déjà un Array<[string, HandFrequency[]]> ici
    const loadedFrequencies = new Map(rangeToLoad.handFrequencies || []);
    setHandFrequencies(loadedFrequencies);
    const loadedCustomActions = ensureFoldAction(rangeToLoad.customActions || []);
    setCustomActions(loadedCustomActions);
    setActiveActionId('');

    setLoadDialogOpen(false);
    alert(`Range "${rangeToLoad.name}" chargé avec succès !`);
  }, []);

  const deleteRange = useCallback((idToDelete: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce range ?')) {
      setSavedRanges(prevRanges => {
        const updatedRanges = prevRanges.filter(range => range.id !== idToDelete);
        updateLocalStorageRanges(updatedRanges);
        alert('Range supprimé.');
        return updatedRanges;
      });
    }
  }, [updateLocalStorageRanges]);


  const handleAddAction = useCallback(() => {
    const newAction: Action = {
      id: `custom-${Date.now()}`,
      name: 'Nouvelle Action',
      color: '#aabbcc',
    };
    setCustomActions(prev => [...prev, newAction]);
    setEditingNameId(newAction.id);
    setTempEditedName(newAction.name);
    setEditingColorId(null);
  }, []);

  const handleNameChange = useCallback((actionId: string, newName: string) => {
    setTempEditedName(newName);
    setCustomActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, name: newName } : a
    ));
  }, []);

  const handleNameBlur = useCallback((actionId: string) => {
    setCustomActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, name: tempEditedName.trim() || 'Nom Action' } : a
    ));
    setEditingNameId(null);
    setTempEditedName('');
  }, [tempEditedName]);

  const handleColorClick = useCallback((action: Action) => {
    setEditingColorId(action.id);
    setTempEditedColor(action.color);
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setTempEditedColor(color);
    setCustomActions(prev => prev.map(a =>
        a.id === editingColorId ? { ...a, color: color } : a
    ));
  }, [editingColorId]);

  const handleColorPickerClose = useCallback(() => {
    setEditingColorId(null);
  }, []);


  const handleDeleteAction = useCallback((actionId: string) => {
    if (actionId === DEFAULT_IMPLICIT_ACTION_ID) {
      alert("L'action 'Fold' ne peut pas être supprimée car elle est implicite.");
      return;
    }
    if (window.confirm('Attention: Supprimer cette action la retirera de toutes les mains qui l\'utilisent. Continuer ?')) {
      setCustomActions(prev => {
        const updatedActions = prev.filter(a => a.id !== actionId);
        if (activeActionId === actionId) {
            setActiveActionId('');
        }
        return updatedActions;
      });
      setHandFrequencies(prevFrequencies => {
        const newFrequencies = new Map(prevFrequencies);
        getAllHandNotations().forEach(hand => {
          const freqsForHand = newFrequencies.get(hand);
          if (freqsForHand) {
            const updatedFreqs = freqsForHand.filter(hf => hf.actionId !== actionId);
            if (updatedFreqs.length === 0) {
              newFrequencies.delete(hand);
            } else {
              newFrequencies.set(hand, updatedFreqs);
            }
          }
        });
        return newFrequencies;
      });
    }
  }, [activeActionId, customActions, handFrequencies]);

  const getActionColorOrDefault = useCallback((actionId: string): string => {
    return customActions.find(a => a.id === actionId)?.color || DEFAULT_EMPTY_HAND_COLOR;
  }, [customActions]);


  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, height: 'calc(100vh - 64px - 20px)' }}>
      {/* Colonne de gauche: Grille de Poker */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1, border: '1px solid #ddd', borderRadius: '8px', overflow: 'auto' }}>
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
          <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveClick} sx={{ mr: 1, mb: { xs: 1, md: 0 } }}>Sauvegarder</Button>
          <Button variant="outlined" startIcon={<FolderOpenIcon />} onClick={() => setLoadDialogOpen(true)} sx={{ mr: 1, mb: { xs: 1, md: 0 } }}>Charger</Button>
          <Button variant="outlined" startIcon={<ImageIcon />} sx={{ mr: 1, mb: { xs: 1, md: 0 } }}>Exporter PNG</Button>
          <Button variant="outlined" startIcon={<TextFieldsIcon />} sx={{ mb: { xs: 1, md: 0 } }}>Import/Export TXT</Button>
          <Button variant="outlined" onClick={resetGridActions} sx={{ ml: 'auto', mb: { xs: 1, md: 0 } }}>Reset Grille</Button>
        </Toolbar>
        <DynamicPokerGrid
          handFrequencies={handFrequencies}
          setHandFrequencies={setHandFrequencies}
          activeActionId={activeActionId}
          activeFrequency={activeFrequency}
          customActions={customActions}
        />
      </Box>

      {/* Colonne de droite: Panneau de contrôle des actions et de la palette */}
      <Paper elevation={3} sx={{ width: { xs: '100%', md: '300px' }, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}> {/* START Paper */}
        <Typography variant="h6" gutterBottom>Actions de Range</Typography>
        <Divider sx={{ my: 1 }} />

        {/* List of Defined Actions (palette and inline management) */}
        <List sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #eee', borderRadius: '4px', p: 0 }}>
          {customActions.length === 1 && customActions[0].id === DEFAULT_IMPLICIT_ACTION_ID ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Aucune action personnalisée définie (seule l'action 'Fold' est présente par défaut).</Typography>
          ) : (
            customActions.map(action => (
              <ListItem
                key={action.id}
                disablePadding
                sx={{
                  mb: 1,
                  borderBottom: '1px solid #eee',
                  '&:last-child': { borderBottom: 'none' },
                  backgroundColor: activeActionId === action.id ? 'action.selected' : 'transparent',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', p: 1 }}>
                  {/* Active Action Selector (Radio Button) */}
                  <IconButton
                    onClick={() => setActiveActionId(action.id === activeActionId ? '' : action.id)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    {activeActionId === action.id ? <RadioButtonCheckedIcon color="primary" /> : <RadioButtonUncheckedIcon />}
                  </IconButton>

                  {/* Color Preview and Picker Trigger */}
                  <Tooltip title="Changer la couleur" arrow TransitionComponent={Fade} TransitionProps={{ timeout: 600 }}>
                    <Button
                      sx={{
                        minWidth: '36px', height: '36px', p: 0, borderRadius: '4px',
                        backgroundColor: action.color,
                        border: '1px solid #ccc', mr: 1,
                        '&:hover': { backgroundColor: action.color, opacity: 0.8 }
                      }}
                      onClick={() => handleColorClick(action)}
                      disabled={action.id === DEFAULT_IMPLICIT_ACTION_ID}
                    />
                  </Tooltip>
                  {editingColorId === action.id && (
                    <ClickAwayListener onClickAway={handleColorPickerClose}>
                      <Box sx={{ position: 'absolute', zIndex: 1000, mt: 15, ml: -10 }}>
                        <DynamicColorPicker color={action.color} onChange={(c) => handleColorChange(c)} />
                      </Box>
                    </ClickAwayListener>
                  )}

                  {/* Action Name Input Field */}
                  {editingNameId === action.id ? (
                    <TextField
                      inputRef={nameInputRef}
                      variant="standard"
                      value={tempEditedName}
                      onChange={(e) => handleNameChange(action.id, e.target.value)}
                      onBlur={() => handleNameBlur(action.id)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      sx={{ flexGrow: 1, mr: 1 }}
                      disabled={action.id === DEFAULT_IMPLICIT_ACTION_ID}
                      InputProps={{ disableUnderline: true }}
                    />
                  ) : (
                    <Typography
                      variant="body1"
                      sx={{ flexGrow: 1, cursor: action.id === DEFAULT_IMPLICIT_ACTION_ID ? 'default' : 'pointer' }}
                      onClick={() => {
                          if (action.id !== DEFAULT_IMPLICIT_ACTION_ID) {
                              setEditingNameId(action.id);
                              setTempEditedName(action.name);
                          }
                      }}
                    >
                      {action.name}
                    </Typography>
                  )}

                  {/* Delete Button */}
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteAction(action.id)} disabled={action.id === DEFAULT_IMPLICIT_ACTION_ID}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))
          )}
        </List>

        {/* Add Action Button */}
        <Button
          onClick={handleAddAction}
          variant="outlined"
          fullWidth
          startIcon={<AddIcon />}
          sx={{ mt: 2 }}
        >
          Ajouter Action
        </Button>

        <Divider sx={{ my: 2 }} />

        {/* Active Action Display (Chip) */}
        {activeActionId ? (
          <Chip
            label={`Action active : ${customActions.find(a => a.id === activeActionId)?.name || 'N/A'} (${activeFrequency}%)`}
            sx={{
              backgroundColor: getActionColorOrDefault(activeActionId),
              color: DEFAULT_TEXT_COLOR,
              mb: 2,
              '& .MuiChip-label': { fontWeight: 'bold' }
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Veuillez sélectionner une action dans la palette ci-dessus pour peindre.
          </Typography>
        )}
      </Paper> {/* END Paper */}

      {/* Boîtes de dialogue Sauvegarder et Charger (restent des popups) */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Sauvegarder le Range</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du Range"
            type="text"
            fullWidth
            variant="standard"
            value={newRangeName}
            onChange={(e) => setNewRangeName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Annuler</Button>
          <Button onClick={saveCurrentRange} disabled={!newRangeName.trim()}>Sauvegarder</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={loadDialogOpen} onClose={() => setLoadDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Charger un Range</DialogTitle>
        <DialogContent dividers>
          {savedRanges.length === 0 ? (
            <Typography>Aucun range sauvegardé pour le moment.</Typography>
          ) : (
            <List>
              {savedRanges.map((range) => (
                <ListItem
                  key={range.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => deleteRange(range.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{
                    '&:hover': { backgroundColor: '#f5f5f5', cursor: 'pointer' },
                    mb: 1,
                    border: '1px solid #eee',
                    borderRadius: '4px',
                  }}
                  onClick={() => loadRange(range)}
                >
                  <ListItemText
                    primary={range.name}
                    secondary={`Créé le: ${new Date(range.createdAt).toLocaleDateString()} ${new Date(range.createdAt).toLocaleTimeString()}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoadDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}