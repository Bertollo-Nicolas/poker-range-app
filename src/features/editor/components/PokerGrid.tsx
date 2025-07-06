// src/features/editor/components/PokerGrid.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useRangeStore } from '@/store/rangeStore';

// Import des constantes
import {
  DEFAULT_EMPTY_HAND_COLOR,
  DEFAULT_TEXT_COLOR,
} from '@/lib/constants';

// --- Constantes et fonctions utilitaires ---
const getHandNotation = (row: number, col: number): string => {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const rank1 = ranks[row];
  const rank2 = ranks[col];
  if (row === col) return `${rank1}${rank1}`;
  if (row < col) return `${rank1}${rank2}s`;
  return `${rank2}${rank1}o`;
};
const GRID_SIZE = 13;
const CELL_SIZE = 50;
const PADDING = 5;
const STAGE_WIDTH = GRID_SIZE * (CELL_SIZE + PADDING) + PADDING;
const STAGE_HEIGHT = STAGE_WIDTH;
// --- FIN des constantes ---

export const PokerGrid = () => {
  const {
    handFrequencies,
    activeBrush,
    customActions,
    updateHand,
  } = useRangeStore();

  const stageRef = useRef<Konva.Stage>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing.current) {
        isDrawing.current = false;
      }
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleCellMouseDown = (hand: string) => {
    if (!activeBrush) return;
    isDrawing.current = true;
    updateHand(hand);
  };

  const handleCellMouseMove = (hand: string) => {
    if (!isDrawing.current || !activeBrush) return;
    updateHand(hand);
  };

  return (
    <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT} ref={stageRef}>
      <Layer>
        {Array.from({ length: GRID_SIZE }).flatMap((_, row) =>
          Array.from({ length: GRID_SIZE }).map((_, col) => {
            const hand = getHandNotation(row, col);
            const x = col * (CELL_SIZE + PADDING) + PADDING;
            const y = row * (CELL_SIZE + PADDING) + PADDING;

            const freqs = handFrequencies.get(hand);

            return (
              <Group
                key={hand}
                x={x}
                y={y}
                onMouseDown={() => handleCellMouseDown(hand)}
                onMouseMove={() => handleCellMouseMove(hand)}
              >
                {/* Le conteneur de la cellule qui écoute les clics */}
                <Rect
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    stroke="#ccc"
                    strokeWidth={1}
                    cornerRadius={5}
                />

                {/* --- NOUVELLE LOGIQUE DE DESSIN DES BARRES --- */}
                {(!freqs || freqs.length === 0) ? (
                    // Cas 1: Pas d'action, on dessine juste le fond
                    <Rect width={CELL_SIZE} height={CELL_SIZE} fill={DEFAULT_EMPTY_HAND_COLOR} cornerRadius={5} />
                ) : (
                    // Cas 2: Une ou plusieurs actions, on dessine les barres
                    <Group>
                        {(() => {
                            let currentX = 0;
                            return freqs.map(f => {
                                const action = customActions.find(a => a.id === f.actionId);
                                const color = action?.color || DEFAULT_EMPTY_HAND_COLOR;
                                const width = (f.frequency / 100) * CELL_SIZE;
                                
                                const rect = (
                                    <Rect
                                        key={f.actionId}
                                        x={currentX}
                                        y={0}
                                        width={width}
                                        height={CELL_SIZE}
                                        fill={color}
                                    />
                                );
                                currentX += width;
                                return rect;
                            });
                        })()}
                    </Group>
                )}
                
                {/* Le texte de la main, toujours par-dessus */}
                <Text
                  text={hand}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  align="center"
                  verticalAlign="middle"
                  fontSize={16}
                  fontFamily="Arial"
                  fill={DEFAULT_TEXT_COLOR}
                  listening={false} // Important pour que les clics aillent au Rect en dessous
                />
              </Group>
            );
          })
        )}
      </Layer>
    </Stage>
  );
};

export default PokerGrid;