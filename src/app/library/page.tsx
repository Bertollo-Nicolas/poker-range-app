// src/app/library/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField, // Ajouté pour la barre de recherche
  InputAdornment, // Pour l'icône de recherche
  IconButton, // Pour le bouton de suppression
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search'; // Icône de recherche
import DeleteIcon from '@mui/icons-material/Delete'; // Icône de suppression

// Interface pour un range sauvegardé (doit correspondre à celle de l'éditeur et du trainer)
interface SavedRange {
  id: string;
  name: string;
  actions: Array<[string, string]>;
  createdAt: number;
}

export default function LibraryPage() {
  const [savedRanges, setSavedRanges] = useState<SavedRange[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // État pour le terme de recherche

  // Charge les ranges sauvegardées depuis localStorage au chargement de la page
  useEffect(() => {
    try {
      const storedRanges = localStorage.getItem('pokerRanges');
      if (storedRanges) {
        const loadedRanges: SavedRange[] = JSON.parse(storedRanges);
        // Assurez-vous que les anciennes structures 'colors' sont converties en 'actions'
        const normalizedRanges = loadedRanges.map(range => ({
          ...range,
          actions: (range as any).colors || range.actions // Utilise 'colors' si 'actions' n'existe pas
        }));
        setSavedRanges(normalizedRanges.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (error) {
      console.error("Failed to load ranges from localStorage:", error);
    }
  }, []);

  // Fonction utilitaire pour mettre à jour localStorage après un changement dans savedRanges
  const updateLocalStorageRanges = useCallback((updatedRanges: SavedRange[]) => {
    try {
      localStorage.setItem('pokerRanges', JSON.stringify(updatedRanges));
    } catch (error) {
      console.error("Failed to update ranges in localStorage:", error);
      alert("Erreur lors de la mise à jour des ranges. Veuillez réessayer.");
    }
  }, []);

  // Fonction pour supprimer un range (réutilisée du Trainer/Editor)
  const deleteRange = useCallback((idToDelete: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce range ?')) {
      setSavedRanges(prevRanges => {
        const updatedRanges = prevRanges.filter(range => range.id !== idToDelete);
        updateLocalStorageRanges(updatedRanges);
        alert('Range supprimé de la bibliothèque.');
        return updatedRanges;
      });
    }
  }, [updateLocalStorageRanges]);

  // Filtrer les ranges en fonction du terme de recherche
  const filteredRanges = savedRanges.filter(range =>
    range.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Bibliothèque de Ranges
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {/* Barre de recherche */}
        <TextField
          fullWidth
          label="Rechercher par nom de range"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {filteredRanges.length === 0 ? (
          <Typography>
            {searchTerm ? `Aucun range trouvé pour "${searchTerm}".` : 'Aucun range sauvegardé pour le moment.'}
          </Typography>
        ) : (
          <List>
            {filteredRanges.map((range) => (
              <ListItem
                key={range.id}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => deleteRange(range.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
                sx={{
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  mb: 1, // Marge en bas pour séparer les éléments
                  border: '1px solid #eee',
                  borderRadius: '4px',
                }}
              >
                <ListItemText
                  primary={range.name}
                  secondary={`Créé le: ${new Date(range.createdAt).toLocaleDateString()} ${new Date(range.createdAt).toLocaleTimeString()}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}