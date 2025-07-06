// src/features/editor/components/PokerGrid.tsx
'use client';

import React, { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';

// Import des constantes et fonctions
import {
  DEFAULT_IMPLICIT_ACTION_ID,
  getColorForAction,
  DEFAULT_EMPTY_HAND_COLOR,
  DEFAULT_TEXT_COLOR,
  SELECTION_HIGHLIGHT_COLOR,
  Action
} from '@/lib/constants'; // Utilisation de l'alias @/
import { getAllHandNotations } from '@/features/editor/utils/handUtils'; // Utilisation de l'alias @/


const getHandNotation = (row: number, col: number): string => {
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const rank1 = ranks[row];
    const rank2 = ranks[col];

    if (row === col) {
        return `${rank1}${rank1}`;
    } else if (row < col) {
        return `${rank1}${rank2}s`;
    } else {
        return `${rank2}${rank1}o`;
    }
};

const GRID_SIZE = 13;
const CELL_SIZE = 50;
const PADDING = 5;
const STAGE_WIDTH = GRID_SIZE * (CELL_SIZE + PADDING) + PADDING;
const STAGE_HEIGHT = STAGE_WIDTH;

interface HandFrequency {
  actionId: string;
  frequency: number;
}

interface PokerGridProps {
  handFrequencies: Map<string, HandFrequency[]>;
  setHandFrequencies: React.Dispatch<React.SetStateAction<Map<string, HandFrequency[]>>>;
  activeActionId: string;
  activeFrequency: number;
  customActions: Action[]; // La liste des actions personnalisées du parent
}

const PokerGrid = forwardRef(({ handFrequencies, setHandFrequencies, activeActionId, activeFrequency, customActions }: PokerGridProps, ref) => {
  const stageRef = useRef<Konva.Stage>(null);

  const tempSelectedHands = useRef<Set<string>>(new Set());
  const [_, setForceUpdate] = useState(0);

  const isDrawing = useRef(false);
  const dragMode = useRef<'add' | 'remove' | null>(null);
  const processedHandsInDrag = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.width(STAGE_WIDTH);
      stageRef.current.height(STAGE_HEIGHT);
      stageRef.current.batchDraw();
    }

    const handleGlobalMouseUp = () => {
      if (isDrawing.current) {
        isDrawing.current = false;
        dragMode.current = null;
        processedHandsInDrag.current.clear();
        tempSelectedHands.current.clear();
        setForceUpdate(prev => prev + 1);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mouseleave', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, []);

  const applyActionToHand = useCallback((hand: string) => {
    if (!activeActionId) return; // Ne fait rien si aucune action active n'est sélectionnée

    setHandFrequencies(prevHandFrequencies => {
      const newHandFrequencies = new Map(prevHandFrequencies);
      const currentFreqs = newHandFrequencies.get(hand) || [];

      const actionToModify: HandFrequency = { actionId: activeActionId, frequency: activeFrequency };

      if (dragMode.current === 'remove') { // Mode "effacer"
        const updatedFreqs = currentFreqs.filter(hf => hf.actionId !== actionToModify.actionId);
        if (updatedFreqs.length === 0) {
          newHandFrequencies.delete(hand);
        } else {
          newHandFrequencies.set(hand, updatedFreqs);
        }
      } else { // Mode "ajouter" ou "modifier"
        const existingIndex = currentFreqs.findIndex(hf => hf.actionId === actionToModify.actionId);

        if (existingIndex !== -1) {
          // Si l'action existe déjà, la mettre à jour
          currentFreqs[existingIndex].frequency = actionToModify.frequency;
        } else {
          // Sinon, l'ajouter
          currentFreqs.push(actionToModify);
        }
        newHandFrequencies.set(hand, [...currentFreqs]);
      }
      return newHandFrequencies;
    });

    tempSelectedHands.current.add(hand);
    setForceUpdate(prev => prev + 1);
  }, [activeActionId, activeFrequency, setHandFrequencies]);


  const handleCellMouseDown = useCallback((hand: string) => {
    if (!activeActionId) return; // Ne démarre pas le drag si pas d'action active
    isDrawing.current = true;
    processedHandsInDrag.current.clear();
    tempSelectedHands.current.clear();

    const currentHandFreqs = handFrequencies.get(hand) || [];
    const isActiveActionAssigned = currentHandFreqs.some(hf => hf.actionId === activeActionId && hf.frequency > 0);

    if (isActiveActionAssigned) {
      dragMode.current = 'remove';
    } else {
      dragMode.current = 'add';
    }

    applyActionToHand(hand);
    processedHandsInDrag.current.add(hand);
  }, [activeActionId, handFrequencies, applyActionToHand]);


  const handleCellMouseMove = useCallback((hand: string) => {
    if (!isDrawing.current || !activeActionId) { // Ne fait rien si pas en train de drag ou pas d'action active
      return;
    }
    if (!processedHandsInDrag.current.has(hand)) {
        applyActionToHand(hand);
        processedHandsInDrag.current.add(hand);
    }
  }, [isDrawing, activeActionId, applyActionToHand]);

  const handleSingleClick = useCallback((hand: string) => {
    if (!isDrawing.current && activeActionId) { // Gère le clic simple si pas de drag et action active
        setHandFrequencies(prevHandFrequencies => {
            const newHandFrequencies = new Map(prevHandFrequencies);
            const currentFreqs = newHandFrequencies.get(hand) || [];
            const actionToModify: HandFrequency = { actionId: activeActionId, frequency: activeFrequency };

            const existingIndex = currentFreqs.findIndex(hf => hf.actionId === actionToModify.actionId);

            if (existingIndex !== -1 && currentFreqs[existingIndex].frequency > 0) {
                // Si l'action existe et a une fréquence > 0, on la retire
                const updatedFreqs = currentFreqs.filter(hf => hf.actionId !== actionToModify.actionId);
                if (updatedFreqs.length === 0) {
                    newHandFrequencies.delete(hand);
                } else {
                    newHandFrequencies.set(hand, updatedFreqs);
                }
            } else {
                // Sinon, on l'ajoute ou la met à jour
                const newFreqs = existingIndex !== -1
                    ? currentFreqs.map((hf, idx) => idx === existingIndex ? actionToModify : hf)
                    : [...currentFreqs, actionToModify];
                newHandFrequencies.set(hand, newFreqs);
            }
            return newHandFrequencies;
        });
    }
  }, [isDrawing, activeActionId, activeFrequency, setHandFrequencies]);


  // Fonction pour calculer la couleur mixte (simplifié pour l'instant)
  // Prend maintenant la liste complète des actions customisées pour trouver les couleurs
  const calculateMixedColor = useCallback((freqs: HandFrequency[]): string => {
    if (freqs.length === 0) {
      return DEFAULT_EMPTY_HAND_COLOR;
    }
    // Pour l'instant, on prend la couleur de la première action avec fréquence > 0
    const mainAction = freqs.find(hf => hf.frequency > 0);
    if (mainAction) {
      return getColorForAction(mainAction.actionId, customActions); // Passe customActions ici
    }
    return DEFAULT_EMPTY_HAND_COLOR;
  }, [customActions]); // Dépend de customActions

  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = col * (CELL_SIZE + PADDING) + PADDING;
        const y = row * (CELL_SIZE + PADDING) + PADDING;
        const hand = getHandNotation(row, col);

        let fillColor: string = '';
        let textColor = DEFAULT_TEXT_COLOR;

        const handFreqs = handFrequencies.get(hand);

        // 1. Déterminer la couleur de base à partir des fréquences ou par défaut
        if (handFreqs && handFreqs.length > 0) {
          fillColor = calculateMixedColor(handFreqs);
        } else {
          fillColor = DEFAULT_EMPTY_HAND_COLOR; // Si pas de fréquences définies, c'est la couleur par défaut (Noir)
        }

        // 2. Surligner si la main est temporairement sélectionnée par glisser-déposer
        if (tempSelectedHands.current.has(hand) && isDrawing.current) {
            fillColor = SELECTION_HIGHLIGHT_COLOR;
            textColor = DEFAULT_TEXT_COLOR;
        }

        cells.push(
          <Rect
            key={`rect-${row}-${col}`}
            x={x}
            y={y}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={fillColor}
            stroke="#ccc"
            strokeWidth={1}
            cornerRadius={5}
            onMouseDown={() => handleCellMouseDown(hand)}
            onMouseMove={() => handleCellMouseMove(hand)}
            onClick={() => handleSingleClick(hand)}
            onTap={() => handleSingleClick(hand)}
            // Style de curseur pour les cellules individuelles
            cursor={activeActionId ? (isDrawing.current ? 'crosshair' : 'pointer') : 'default'}
          />,
          <Text
            key={`text-${row}-${col}`}
            x={x}
            y={y + CELL_SIZE / 2 - 8}
            width={CELL_SIZE}
            height={CELL_SIZE}
            text={hand}
            fontSize={16}
            fontFamily="Arial"
            fill={textColor}
            align="center"
            verticalAlign="middle"
            onMouseDown={() => handleCellMouseDown(hand)}
            onMouseMove={() => handleCellMouseMove(hand)}
            onClick={() => handleSingleClick(hand)}
            onTap={() => handleSingleClick(hand)}
            // Style de curseur pour le texte
            cursor={activeActionId ? (isDrawing.current ? 'crosshair' : 'pointer') : 'default'}
          />
        );
      }
    }
    return cells;
  };

  return (
    <Stage
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      ref={stageRef}
      style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', cursor: isDrawing.current ? 'crosshair' : 'default' }}
    >
      <Layer>{renderGrid()}</Layer>
    </Stage>
  );
});

export default PokerGrid;