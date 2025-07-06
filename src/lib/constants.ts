// src/lib/constants.ts

export interface Action {
  id: string;
  name: string;
  color: string;
}

// Palette d'actions par défaut simplifiée : ne contient que l'action 'Fold'.
// Les autres actions (Call, Raise, etc.) devront être ajoutées par l'utilisateur.
export const DEFAULT_ACTION_PALETTE: Action[] = [
  { id: 'Fold', name: 'Fold', color: '#F44336' }, // Seule l'action 'Fold' par défaut
];

export const DEFAULT_IMPLICIT_ACTION_ID = 'Fold';

export const DEFAULT_EMPTY_HAND_COLOR = '#111111'; // Noir
export const DEFAULT_TEXT_COLOR = '#fff'; // Blanc

export const SELECTION_HIGHLIGHT_COLOR = '#607d8b';

export const getColorForAction = (actionId: string, actionsList: Action[] = DEFAULT_ACTION_PALETTE): string => {
  return actionsList.find(action => action.id === actionId)?.color || DEFAULT_EMPTY_HAND_COLOR;
};

export const SUITS = ['♠', '♥', '♦', '♣'];

export const getCardNotation = (handNotation: string): string => {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const getRandomSuit = (): string => getRandomElement(SUITS);

  let rank1: string;
  let rank2: string;
  let type: 'pair' | 'suited' | 'offsuit';

  if (handNotation.length === 2) {
    if (handNotation[0] === handNotation[1]) {
      rank1 = handNotation[0];
      rank2 = handNotation[1];
      type = 'pair';
    } else {
      rank1 = handNotation[0];
      rank2 = handNotation[1];
      type = 'offsuit';
    }
  } else if (handNotation.length === 3) {
    rank1 = handNotation[0];
    rank2 = handNotation[1];
    if (handNotation[2] === 's') {
      type = 'suited';
    } else if (handNotation[2] === 'o') {
      type = 'offsuit';
    } else {
      type = 'offsuit';
    }
  } else {
    rank1 = handNotation[0];
    rank2 = handNotation[1];
    type = 'offsuit';
  }

  let suit1: string;
  let suit2: string;

  if (type === 'suited') {
    suit1 = getRandomSuit();
    suit2 = suit1;
  } else if (type === 'pair') {
    suit1 = getRandomSuit();
    let remainingSuits = SUITS.filter(s => s !== suit1);
    suit2 = getRandomElement(remainingSuits);
  } else { // offsuit
    suit1 = getRandomSuit();
    let remainingSuits = SUITS.filter(s => s !== suit1);
    suit2 = getRandomElement(remainingSuits);
  }

  return `${rank1}${suit1} ${rank2}${suit2}`;
};