// src/store/rangeStore.ts
import { create } from 'zustand';
import {
  Action,
  DEFAULT_IMPLICIT_ACTION_ID,
} from '@/lib/constants';
import { getAllHandNotations } from '@/features/editor/utils/handUtils';
import { useEffect } from 'react';


export interface ActionMix {
  id: string;
  // Un mix contient 1 ou 2 actions. La 2ème peut être nulle.
  actions: [{ actionId: string }, { actionId: string }?];
  // Fréquence de la PREMIÈRE action. La 2ème est implicitement (100 - frequency)
  frequency: number; 
}

// Le "pinceau" actif qui peut être soit une action simple, soit un mix
export interface ActiveBrush {
  type: 'simple' | 'mix';
  id: string;
}

// Structure pour le JSON de sauvegarde
interface SavedHandInJson {
    hand: string;
    frequencies: { actionId: string; frequency: number }[];
}
interface SavedRangeInJson {
    id: string;
    name: string;
    hands: SavedHandInJson[];
    customActions: Action[];
    createdAt: number;
}

interface HandFrequency {
  actionId: string;
  frequency: number;
}

interface SavedRange {
  id: string;
  name: string;
  handFrequencies: Array<[string, HandFrequency[]]>;
  customActions: Action[];
  createdAt: number;
}

const ensureDefaultAction = (actions: Action[]): Action[] => {
  if (actions.length === 0) {
    // Si aucune action n'existe, on en crée une par défaut
    return [{
      id: `custom-${Date.now()}`,
      name: 'Nouvelle Action',
      color: '#4CAF50' // Un vert par défaut
    }];
  }
  return actions;
};

// Nouveaux types pour le format JSON souhaité
interface SavedHand {
  hand: string;
  actionId: string; // On garde l'ID pour la logique
  frequency: number;
}

interface SavedRangeInJson {
  id: string;
  name: string;
  hands: SavedHand[];
  customActions: Action[];
  createdAt: number;
}
// L'interface complète de notre état
interface RangeState {
  handFrequencies: Map<string, HandFrequency[]>;
  customActions: Action[];
  activeActionId: string;
  activeFrequency: number;
  savedRanges: any[];
  isSaveDialogOpen: boolean;
  isLoadDialogOpen: boolean;
  actionMixes: ActionMix[];       // <-- NOUVEAU: Liste des mixes créés
  activeBrush: ActiveBrush | null; // <-- NOUVEAU: Le pinceau actif
  
  // Actions
  updateHand: (hand: string) => void; 
  loadInitialData: () => void;
  setHandFrequencies: (newFrequencies: Map<string, HandFrequency[]>) => void;
  setActiveActionId: (actionId: string) => void;
  setActiveFrequency: (frequency: number) => void;
  resetGrid: () => void;
  
  // Actions sur la palette
  addCustomAction: () => string; // Retourne l'ID de la nouvelle action pour l'édition
  updateCustomAction: (actionId: string, updatedAction: Partial<Action>) => void;
  deleteCustomAction: (actionId: string) => void;

  // NOUVELLES actions pour les mixes
  addActionMix: () => void;
  updateActionMix: (mixId: string, updates: Partial<ActionMix>) => void;
  deleteActionMix: (mixId:string) => void;
  setActiveBrush: (brush: ActiveBrush | null) => void;
  
  // Dialogs
  openSaveDialog: () => void;
  closeSaveDialog: () => void;
  openLoadDialog: () => void;
  closeLoadDialog: () => void;
  
  // Actions sur les ranges sauvegardés
  saveRange: (rangeName: string) => void;
  loadRange: (rangeToLoad: SavedRange) => void;
  deleteRange: (idToDelete: string) => void;
  
}

// Création du Store
export const useRangeStore = create<RangeState>((set, get) => ({
  // --- ÉTAT INITIAL ---
  handFrequencies: new Map(),
  customActions: [],
  activeActionId: '',
  activeFrequency: 100,
  savedRanges: [],
  isSaveDialogOpen: false,
  isLoadDialogOpen: false,
  actionMixes: [],
  activeBrush: null,


// Remplacez votre loadInitialData existante par celle-ci
loadInitialData: () => {
  try {
      const storedActions = localStorage.getItem('defaultCustomActions');
      const loadedActions: Action[] = storedActions ? JSON.parse(storedActions) : [];
      set({ customActions: ensureDefaultAction(loadedActions) });

      // On ne charge que la liste des noms/ID pour le dialogue de chargement
      const storedRanges: SavedRangeInJson[] = JSON.parse(localStorage.getItem('pokerRanges') || '[]');
      const savedRangesForDialog = storedRanges.map(r => ({ id: r.id, name: r.name, createdAt: r.createdAt }));
      set({ savedRanges: savedRangesForDialog.sort((a, b) => b.createdAt - a.createdAt) as any });

  } catch (error) {
      console.error("Failed to load data from localStorage:", error);
  }
},

  setHandFrequencies: (newFrequencies) => set({ handFrequencies: newFrequencies }),
  setActiveActionId: (actionId) => set({ activeActionId: actionId }),
  setActiveFrequency: (frequency) => set({ activeFrequency: frequency }),
  resetGrid: () => set({ handFrequencies: new Map() }),

  // --- GESTION PALETTE ---
  addCustomAction: () => {
    const newAction: Action = { id: `custom-${Date.now()}`, name: 'Nouvelle Action', color: '#aabbcc' };
    set(state => ({ customActions: [...state.customActions, newAction] }));
    return newAction.id;
  },
  
  updateCustomAction: (actionId, updatedAction) => {
    set(state => ({
      customActions: state.customActions.map(a =>
        a.id === actionId ? { ...a, ...updatedAction } : a
      )
    }));
  },
  
  deleteCustomAction: (actionId) => {
    if (actionId === DEFAULT_IMPLICIT_ACTION_ID) return;
    
    set(state => {
      // Logique de suppression complexe de votre page.tsx
      const newFrequencies = new Map(state.handFrequencies);
      getAllHandNotations().forEach(hand => {
        const freqsForHand = newFrequencies.get(hand);
        if (freqsForHand) {
          const updatedFreqs = freqsForHand.filter(hf => hf.actionId !== actionId);
          if (updatedFreqs.length === 0) newFrequencies.delete(hand);
          else newFrequencies.set(hand, updatedFreqs);
        }
      });
      
      return {
        customActions: state.customActions.filter(a => a.id !== actionId),
        handFrequencies: newFrequencies,
        activeActionId: state.activeActionId === actionId ? '' : state.activeActionId
      }
    });
  },

  setActiveBrush: (brush) => set({ activeBrush: brush }),
    
  addActionMix: () => {
      const newMix: ActionMix = {
          id: `mix-${Date.now()}`,
          actions: [{ actionId: get().customActions[0]?.id }], // Prend la 1ère action par défaut
          frequency: 100,
      };
      set(state => ({ actionMixes: [...state.actionMixes, newMix] }));
  },
  
  updateActionMix: (mixId, updates) => {
      set(state => ({
          actionMixes: state.actionMixes.map(mix => 
              mix.id === mixId ? { ...mix, ...updates } : mix
          ),
      }));
  },

  deleteActionMix: (mixId) => {
      set(state => ({
          actionMixes: state.actionMixes.filter(mix => mix.id !== mixId),
          // Si le mix supprimé était actif, on désélectionne le pinceau
          activeBrush: get().activeBrush?.id === mixId ? null : get().activeBrush,
      }));
  },

  // ...toutes vos autres actions...
  updateHand: (hand) => {
    const { handFrequencies, activeBrush, actionMixes } = get();
    if (!activeBrush) return;

    const newHandFrequencies = new Map(handFrequencies);

    if (activeBrush.type === 'simple') {
        // Logique existante pour une action simple
        const existingFreqs = newHandFrequencies.get(hand) || [];
        const existingIndex = existingFreqs.findIndex(f => f.actionId === activeBrush.id);
        if (existingIndex !== -1) {
            newHandFrequencies.delete(hand);
        } else {
            newHandFrequencies.set(hand, [{ actionId: activeBrush.id, frequency: 100 }]);
        }
    } else { // 'mix'
        const mix = actionMixes.find(m => m.id === activeBrush.id);
        if (!mix) return;
        
        const freqs: HandFrequency[] = [];
        freqs.push({ actionId: mix.actions[0].actionId, frequency: mix.frequency });
        
        if (mix.actions[1] && mix.frequency < 100) {
            freqs.push({ actionId: mix.actions[1].actionId, frequency: 100 - mix.frequency });
        }
        newHandFrequencies.set(hand, freqs);
    }
    set({ handFrequencies: newHandFrequencies });
},

  // --- GESTION DIALOGS ---
  openSaveDialog: () => set({ isSaveDialogOpen: true }),
  closeSaveDialog: () => set({ isSaveDialogOpen: false }),
  openLoadDialog: () => set({ isLoadDialogOpen: true }),
  closeLoadDialog: () => set({ isLoadDialogOpen: false }),

  // --- GESTION RANGES SAUVEGARDÉS ---
  saveRange: (rangeName) => {
    if (!rangeName.trim()) return;

    const { handFrequencies, customActions } = get();
        
    const handsForJson: SavedHandInJson[] = getAllHandNotations().map(hand => {
        const freqs = handFrequencies.get(hand);
        let frequenciesToSave: { actionId: string, frequency: number }[] = [];

        if (freqs && freqs.length > 0) {
            frequenciesToSave = freqs.map(f => ({ actionId: f.actionId, frequency: f.frequency }));
        }
        // Si pas de fréquence, le tableau sera vide par défaut, ce qui est ok
        
        return { hand, frequencies: frequenciesToSave };
    });

    const newRangeForJson: SavedRangeInJson = {
        id: Date.now().toString(), name: rangeName.trim(), hands: handsForJson,
        customActions: customActions, createdAt: Date.now(),
    };


    // On sauvegarde le nouveau format dans le localStorage
    const existingRangesForJson = JSON.parse(localStorage.getItem('pokerRanges') || '[]');
    const updatedRangesForJson = [...existingRangesForJson, newRangeForJson];
    localStorage.setItem('pokerRanges', JSON.stringify(updatedRangesForJson));

    // On met à jour l'état interne (qui utilise toujours des Maps)
    get().loadInitialData(); // Le plus simple est de tout recharger
    set({ isSaveDialogOpen: false });
  },

  // Remplacez votre loadRange existante par celle-ci
  loadRange: (rangeId) => {
    const rangesFromStorage: SavedRangeInJson[] = JSON.parse(localStorage.getItem('pokerRanges') || '[]');
    const rangeToLoad = rangesFromStorage.find(r => r.id === rangeId);

    if (!rangeToLoad) {
        console.error("Range non trouvé !");
        return;
    }

    // Conversion du tableau plat en Map pour l'état de l'application
    const newHandFrequencies = new Map<string, HandFrequency[]>();
        rangeToLoad.hands.forEach(savedHand => {
            if (savedHand.frequencies && savedHand.frequencies.length > 0) {
                newHandFrequencies.set(savedHand.hand, savedHand.frequencies);
            }
        });

    set({
        handFrequencies: newHandFrequencies,
        customActions: ensureDefaultAction(rangeToLoad.customActions || []),
        activeActionId: '',
        isLoadDialogOpen: false,
    });
  },
    
  deleteRange: (idToDelete) => {
    const updatedRanges = get().savedRanges.filter(range => range.id !== idToDelete);
    localStorage.setItem('pokerRanges', JSON.stringify(updatedRanges.map(r => ({...r, handFrequencies: Array.from(r.handFrequencies.entries())}))));
    set({ savedRanges: updatedRanges });
  }
}));

// Hook pour initialiser les données côté client
export const useInitStore = () => {
    const loadInitialData = useRangeStore((state) => state.loadInitialData);
    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);
}