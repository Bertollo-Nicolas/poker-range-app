// src/app/trainer/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Paper,
  IconButton, // Ajout pour le bouton de suppression
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // Icône de suppression
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Icône correcte
import CancelIcon from '@mui/icons-material/Cancel'; // Icône incorrecte

// Import des constantes et fonctions utilitaires
//
import { getAllHandNotations } from '../../features/editor/utils/handUtils';
import { DEFAULT_ACTION_PALETTE, getCardNotation } from '@/lib/constants';

// Interface pour un range sauvegardé (doit correspondre à celle de l'éditeur)
interface SavedRange {
  id: string;
  name: string;
  actions: Array<[string, string]>;
  createdAt: number;
}

// Interface pour une main dans le pool d'entraînement
interface TrainingHand {
  notation: string; // Ex: "AKs", "72o", "AA"
  correctAction: string; // Ex: "Call", "Raise", "Fold"
  sourceRangeName: string; // NOUVEAU: Nom de la range d'où provient cette action
}

export default function TrainerPage() {
  const [savedRanges, setSavedRanges] = useState<SavedRange[]>([]);
  const [selectedRangeIds, setSelectedRangeIds] = useState<Set<string>>(new Set());
  const [sessionStarted, setSessionStarted] = useState(false);

  const [trainingPool, setTrainingPool] = useState<TrainingHand[]>([]);
  const [currentHand, setCurrentHand] = useState<TrainingHand | null>(null);
  const [currentCardNotation, setCurrentCardNotation] = useState<string>('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // NOUVEAU: États pour les statistiques
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number | null>(null);


  // Charge les ranges sauvegardées depuis localStorage au chargement de la page
  useEffect(() => {
    try {
      const storedRanges = localStorage.getItem('pokerRanges');
      if (storedRanges) {
        const loadedRanges: SavedRange[] = JSON.parse(storedRanges);
        const normalizedRanges = loadedRanges.map(range => ({
          ...range,
          actions: (range as any).colors || range.actions
        }));
        setSavedRanges(normalizedRanges.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (error) {
      console.error("Failed to load ranges from localStorage:", error);
    }
  }, []);

  // Fonction utilitaire pour mettre à jour localStorage
  const updateLocalStorageRanges = useCallback((updatedRanges: SavedRange[]) => {
    try {
      localStorage.setItem('pokerRanges', JSON.stringify(updatedRanges));
    } catch (error) {
      console.error("Failed to update ranges in localStorage:", error);
      alert("Erreur lors de la mise à jour des ranges. Veuillez réessayer.");
    }
  }, []);

  const handleRangeToggle = useCallback((rangeId: string) => {
    setSelectedRangeIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(rangeId)) {
        newSelected.delete(rangeId);
      } else {
        newSelected.add(rangeId);
      }
      return newSelected;
    });
  }, []);

  // NOUVEAU: Fonction pour supprimer une range
  const deleteRange = useCallback((idToDelete: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce range ?')) {
      setSavedRanges(prevRanges => {
        const updatedRanges = prevRanges.filter(range => range.id !== idToDelete);
        updateLocalStorageRanges(updatedRanges);
        // Désélectionner la range si elle était sélectionnée
        setSelectedRangeIds(prevSelected => {
          const newSelected = new Set(prevSelected);
          newSelected.delete(idToDelete);
          return newSelected;
        });
        alert('Range supprimé.');
        return updatedRanges;
      });
    }
  }, [updateLocalStorageRanges]);


  const prepareTrainingPool = useCallback(() => {
    const combinedHandActions = new Map<string, { action: string, sourceRangeName: string }>(); // NOUVEAU: Stocke aussi le nom de la range
    const allHandsInGrid = getAllHandNotations();

    selectedRangeIds.forEach(rangeId => {
      const range = savedRanges.find(r => r.id === rangeId);
      if (range) {
        const rangeHandActions = new Map(range.actions);
        allHandsInGrid.forEach(handNotation => {
          const action = rangeHandActions.get(handNotation) || 'Fold';
          // La dernière range traitée pour cette main définit l'action et le nom de la source
          combinedHandActions.set(handNotation, { action, sourceRangeName: range.name });
        });
      }
    });

    const pool: TrainingHand[] = Array.from(combinedHandActions.entries()).map(([notation, data]) => ({
      notation,
      correctAction: data.action,
      sourceRangeName: data.sourceRangeName, // NOUVEAU: Ajout du nom de la range source
    }));

    setTrainingPool(pool);
    return pool;
  }, [selectedRangeIds, savedRanges]);


  const getNextHand = useCallback((pool: TrainingHand[]) => {
    if (pool.length === 0) {
      setCurrentHand(null);
      setCurrentCardNotation('');
      setFeedback(null); // Réinitialise le feedback
      setCurrentQuestionStartTime(null); // Réinitialise le chronomètre
      return;
    }
    const randomIndex = Math.floor(Math.random() * pool.length);
    const hand = pool[randomIndex];
    setCurrentHand(hand);
    setCurrentCardNotation(getCardNotation(hand.notation));
    setFeedback(null); // Réinitialise le feedback
    setCurrentQuestionStartTime(Date.now()); // Démarre le chronomètre pour la nouvelle question
  }, []);

  const startTrainingSession = useCallback(() => {
    if (selectedRangeIds.size === 0) {
      alert('Veuillez sélectionner au moins un range pour commencer l\'entraînement.');
      return;
    }
    const pool = prepareTrainingPool();
    if (pool.length === 0) {
        alert('Les ranges sélectionnées ne contiennent aucune main à entraîner.');
        return;
    }
    setSessionStarted(true);
    setTotalQuestions(0); // Initialise les statistiques
    setCorrectAnswers(0);
    setSessionStartTime(Date.now()); // Démarre le chronomètre de session
    getNextHand(pool);
  }, [selectedRangeIds, prepareTrainingPool, getNextHand]);

  const stopTrainingSession = useCallback(() => {
    setSessionStarted(false);
    setTrainingPool([]);
    setCurrentHand(null);
    setCurrentCardNotation('');
    setFeedback(null);
    setTotalQuestions(0);
    setCorrectAnswers(0);
    setSessionStartTime(null);
    setCurrentQuestionStartTime(null);
  }, []);

  const handleUserAnswer = useCallback((selectedActionId: string) => {
    if (!currentHand || feedback !== null) return; // Empêche de répondre plusieurs fois

    setTotalQuestions(prev => prev + 1); // Incrémente le total des questions

    const timeTaken = currentQuestionStartTime ? (Date.now() - currentQuestionStartTime) / 1000 : 0; // Temps en secondes

    if (selectedActionId === currentHand.correctAction) {
      setFeedback('correct');
      setCorrectAnswers(prev => prev + 1); // Incrémente les réponses correctes
    } else {
      setFeedback('incorrect');
    }

    // Après un court délai, passer à la main suivante
    setTimeout(() => {
      getNextHand(trainingPool);
    }, 1500); // 1.5 secondes de feedback
  }, [currentHand, trainingPool, getNextHand, currentQuestionStartTime, feedback]);


  const accuracy = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : '0.0';
  const elapsedTime = sessionStartTime ? ((Date.now() - sessionStartTime) / 1000).toFixed(0) : '0'; // Temps en secondes

  if (sessionStarted) {
    return (
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Session d'Entraînement
        </Typography>
        <Typography variant="h6" gutterBottom>
          Mode Flash Cards
        </Typography>

        {/* NOUVEAU: Affichage des statistiques */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, width: '100%', maxWidth: 400, display: 'flex', justifyContent: 'space-around' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">Questions:</Typography>
            <Typography variant="h6">{totalQuestions}</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">Correctes:</Typography>
            <Typography variant="h6">{correctAnswers}</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">Précision:</Typography>
            <Typography variant="h6">{accuracy}%</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">Temps:</Typography>
            <Typography variant="h6">{elapsedTime}s</Typography>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 4, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 400 }}>
          {currentHand && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
              Range: {currentHand.sourceRangeName} {/* NOUVEAU: Affichage du nom de la range */}
            </Typography>
          )}

          {currentCardNotation ? (
            <Typography variant="h3" sx={{ mb: 3, fontFamily: 'monospace', fontWeight: 'bold' }}>
              {currentCardNotation}
            </Typography>
          ) : (
            <Typography variant="h5" sx={{ mb: 3 }}>Chargement de la main...</Typography>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, width: '100%' }}>
            {DEFAULT_ACTION_PALETTE.map((actionItem) => (
              <Button
                key={actionItem.id}
                variant="contained"
                onClick={() => handleUserAnswer(actionItem.id)}
                sx={{
                  backgroundColor: actionItem.color,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: actionItem.color,
                    opacity: 0.9,
                  },
                  flexGrow: 1,
                  minWidth: '80px',
                }}
                disabled={feedback !== null}
              >
                {actionItem.name}
              </Button>
            ))}
          </Box>

          {feedback && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {feedback === 'correct' ? (
                <CheckCircleIcon color="success" sx={{ fontSize: 30 }} />
              ) : (
                <CancelIcon color="error" sx={{ fontSize: 30 }} />
              )}
              <Typography variant="h6" sx={{ color: feedback === 'correct' ? 'success.main' : 'error.main' }}>
                {feedback === 'correct' ? 'Correct !' : `Incorrect ! La bonne action était : ${currentHand?.correctAction}`}
              </Typography>
            </Box>
          )}

        </Paper>

        <Button variant="outlined" onClick={stopTrainingSession} sx={{ mt: 3 }}>Terminer la session</Button>
      </Box>
    );
  }

  // Interface de sélection des ranges
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Trainer
      </Typography>
      <Typography variant="h6" gutterBottom>
        Sélectionnez les Ranges à Entraîner
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {savedRanges.length === 0 ? (
          <Typography>Aucun range sauvegardé. Veuillez créer et sauvegarder des ranges dans l'éditeur d'abord.</Typography>
        ) : (
          <List>
            {savedRanges.map((range) => {
              const labelId = `checkbox-list-label-${range.id}`;
              return (
                <ListItem
                  key={range.id}
                  disablePadding
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={(e) => {
                      e.stopPropagation(); // Empêche le toggle de la checkbox
                      deleteRange(range.id);
                    }}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton role={undefined} onClick={() => handleRangeToggle(range.id)} dense>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedRangeIds.has(range.id)}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      id={labelId}
                      primary={range.name}
                      secondary={`Sauvegardé le: ${new Date(range.createdAt).toLocaleDateString()} ${new Date(range.createdAt).toLocaleTimeString()}`}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
      <Button variant="contained" onClick={startTrainingSession} disabled={selectedRangeIds.size === 0}>
        Commencer l'entraînement
      </Button>
    </Box>
  );
}