// src/app/editor/page.tsx
'use client';

import { Box } from '@mui/material';
import { useInitStore } from '@/store/rangeStore';
import { ActionsPanel } from '@/features/editor/components/ActionsPanel';
import { MixedColorsPanel } from '@/features/editor/components/MixedColorsPanel'; // <-- Importer le nouveau composant
import { EditorToolbar } from '@/features/editor/components/EditorToolbar';
import { SaveRangeDialog } from '@/features/editor/components/SaveRangeDialog';
import { LoadRangeDialog } from '@/features/editor/components/LoadRangeDialog';
import dynamic from 'next/dynamic';

const PokerGrid = dynamic(
  () => import('@/features/editor/components/PokerGrid'),
  { ssr: false }
);

export default function EditorPage() {
  useInitStore();

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, height: 'calc(100vh - 64px)' }}>
      {/* Colonne de gauche */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <EditorToolbar />
        <PokerGrid />
      </Box>

      {/* Colonne de droite */}
      <Box sx={{ width: { xs: '100%', md: '300px' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ActionsPanel />
        <MixedColorsPanel /> {/* <-- Ajouter le nouveau composant ici */}
      </Box>

      {/* Dialogs */}
      <SaveRangeDialog />
      <LoadRangeDialog />
    </Box>
  );
}