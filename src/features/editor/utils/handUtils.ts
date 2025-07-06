// src/features/editor/utils/handUtils.ts

// Fonction pour générer toutes les 169 notations de mains de poker (AA, AKs, 72o, etc.)
export const getAllHandNotations = (): string[] => {
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const hands: string[] = [];
  
    for (let i = 0; i < ranks.length; i++) {
      for (let j = 0; j < ranks.length; j++) {
        const rank1 = ranks[i];
        const rank2 = ranks[j];
  
        if (i === j) {
          hands.push(`${rank1}${rank1}`); // Paires
        } else if (i < j) {
          hands.push(`${rank1}${rank2}s`); // Suited
        } else {
          hands.push(`${rank2}${rank1}o`); // Offsuit
        }
      }
    }
    return hands;
};