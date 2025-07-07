// src/features/editor/components/TreeItemComponent.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRangeStore, TreeItem } from '@/store/rangeStore';
import { Box, Typography, IconButton, Collapse, TextField } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// Imports pour le Drag and Drop
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TreeItemProps {
  item: TreeItem;
  level: number;
}

export const TreeItemComponent = ({ item, level }: TreeItemProps) => {
  // --- HOOKS D'ÉTAT ---
  const { selectedItemId, setSelectedItem, deleteItem, loadRange, renameItem } = useRangeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedItemId === item.id;

  // --- LOGIQUE DND-KIT ---
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // --- USEEFFECT POUR LE FOCUS ---
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // --- HANDLERS ---
  const handleSelectAndLoad = () => {
    setSelectedItem(isSelected ? null : item.id);
    if (item.type === 'range') {
      loadRange(item.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Supprimer "${item.name}" ?`)) {
      deleteItem(item.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditText(item.name);
    setIsEditing(true);
  };
  
  const handleRename = () => {
    if (editText.trim() && editText.trim() !== item.name) {
      renameItem(item.id, editText.trim());
    }
    setIsEditing(false);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'folder') {
      setIsOpen(!isOpen);
    }
  };

  // --- RENDU DU COMPOSANT ---
  return (
    <div ref={setNodeRef} style={style}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: `${level * 16}px`,
          backgroundColor: isSelected ? 'action.selected' : 'transparent',
          borderRadius: 1,
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        {/* Poignée pour le Drag and Drop (ne déclenche pas les autres clics) */}
        <div {...listeners} {...attributes} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', padding: '4px' }}>
          <DragIndicatorIcon fontSize='small' sx={{ color: 'text.disabled' }}/>
        </div>

        {/* Flèche pour ouvrir/fermer le dossier */}
        {item.type === 'folder' ? (
          <IconButton size="small" onClick={toggleOpen} sx={{ mr: 0.5 }}>
            {item.children.length > 0 && (isOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />)}
          </IconButton>
        ) : (
          <Box sx={{ width: 28, mr: 0.5 }} /> // Espace pour aligner
        )}

        {/* Contenu principal de l'item (cliquable pour sélection/chargement, double-clic pour renommer) */}
        <Box
          onClick={handleSelectAndLoad}
          onDoubleClick={handleDoubleClick}
          sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, cursor: 'pointer', py: '6px' }}
        >
          {item.type === 'folder' ? <FolderIcon sx={{ mr: 1, color: 'text.secondary' }} /> : <InsertDriveFileIcon sx={{ mr: 1, color: 'text.secondary' }} />}
          
          {isEditing ? (
            <TextField
              inputRef={inputRef} variant="standard" size="small"
              value={editText} onChange={(e) => setEditText(e.target.value)}
              onBlur={handleRename} onKeyPress={(e) => {if (e.key === 'Enter') handleRename()}}
              onClick={(e) => e.stopPropagation()} fullWidth
              InputProps={{ disableUnderline: true, sx: { pl: 1 } }}
            />
          ) : (
            <Typography sx={{ userSelect: 'none' }}>{item.name}</Typography>
          )}
        </Box>
        
        <IconButton size="small" onClick={handleDelete} sx={{ ml: 1 }}>
          <DeleteIcon fontSize='small'/>
        </IconButton>
      </Box>

      {/* Affichage des enfants si le dossier est ouvert */}
      {item.type === 'folder' && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          {item.children.map(child => (
            <TreeItemComponent key={child.id} item={child} level={level + 1} />
          ))}
        </Collapse>
      )}
    </div>
  );
};