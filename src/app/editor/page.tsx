// src/app/editor/page.tsx
'use client';

import { Box } from '@mui/material';
import { useInitStore } from '@/store/rangeStore';
import { ActionsPanel } from '@/features/editor/components/ActionsPanel';
import { MixedColorsPanel } from '@/features/editor/components/MixedColorsPanel';
import { RangeLibraryPanel } from '@/features/editor/components/RangeLibraryPanel'; // On va le réécrire
import { EditorToolbar } from '@/features/editor/components/EditorToolbar';
import { SaveRangeDialog } from '@/features/editor/components/SaveRangeDialog';
import dynamic from 'next/dynamic';

const PokerGrid = dynamic(
  () => import('@/features/editor/components/PokerGrid'),
  { ssr: false }
);

export default function EditorPage() {
  useInitStore();

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'row', gap: 3, height: 'calc(100vh - 64px)' }}>
      {/* --- Colonne de Gauche : Bibliothèque --- */}
      <Box sx={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
        <RangeLibraryPanel />
      </Box>
      
      {/* --- Section Centrale : Grille --- */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <EditorToolbar />
        <PokerGrid />
      </Box>

      {/* --- Colonne de Droite : Panneaux d'actions --- */}
      <Box sx={{ width: '300px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ActionsPanel />
        <MixedColorsPanel />
      </Box>

      {/* Les Dialogs restent en dehors du layout principal */}
      <SaveRangeDialog />
    </Box>
  );
}