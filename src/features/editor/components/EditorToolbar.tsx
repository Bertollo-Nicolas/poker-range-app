// src/features/editor/components/EditorToolbar.tsx
'use client';

import React from 'react';
import { useRangeStore } from '@/store/rangeStore';
import { Toolbar, Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';

export const EditorToolbar = () => {
    const { resetGrid } = useRangeStore();

    return (
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<ImageIcon />} sx={{ mr: 1, mb: 1 }}>Exporter PNG</Button>
            <Button variant="outlined" startIcon={<TextFieldsIcon />} sx={{ mb: 1 }}>Import/Export TXT</Button>
            <Button variant="outlined" onClick={resetGrid} sx={{ ml: 'auto', mb: 1 }}>Reset Grille</Button>
        </Toolbar>
    );
}