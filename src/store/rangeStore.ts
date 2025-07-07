// src/store/rangeStore.ts
import { create } from 'zustand';
import { Action } from '@/lib/constants';
import { useEffect } from 'react';

// --- DEFINITION DES TYPES ---

interface HandFrequency {
  actionId: string;
  frequency: number;
}
export interface ActionMix {
  id: string;
  actions: [{ actionId: string }, { actionId: string }?];
  frequency: number; 
}
export interface ActiveBrush {
  type: 'simple' | 'mix';
  id: string;
}

export interface RangeItem {
  id: string;
  type: 'range';
  name: string;
  handFrequencies: Map<string, HandFrequency[]>;
  customActions: Action[];
}
export interface FolderItem {
  id:string;
  type: 'folder';
  name: string;
  children: TreeItem[];
}
export type TreeItem = RangeItem | FolderItem;

// --- FONCTIONS UTILITAIRES POUR L'ARBRE ---
// Fonction pour trouver un item et son parent dans l'arbre
function findItemAndParent(tree: TreeItem[], itemId: string, parent: FolderItem | null = null): { item: TreeItem; parent: FolderItem | null } | null {
  for (const item of tree) {
    if (item.id === itemId) return { item, parent };
    if (item.type === 'folder') {
      const found = findItemAndParent(item.children, itemId, item);
      if (found) return found;
    }
  }
  return null;
}

// Fonction pour retirer un item de l'arbre
function removeItemFromTree(tree: TreeItem[], itemId: string): TreeItem[] {
  const newTree: TreeItem[] = [];
  for (const item of tree) {
    if (item.id === itemId) continue; // On saute l'item à supprimer
    if (item.type === 'folder') {
      item.children = removeItemFromTree(item.children, itemId);
    }
    newTree.push(item);
  }
  return newTree;
}

function findAndRemoveItem(tree: TreeItem[], itemId: string): { newTree: TreeItem[], removedItem: TreeItem | null } {
  let removedItem: TreeItem | null = null;
  
  function remover(currentTree: TreeItem[]): TreeItem[] {
      return currentTree.filter(item => {
          if (item.id === itemId) {
              removedItem = item;
              return false;
          }
          if (item.type === 'folder') {
              item.children = remover(item.children);
          }
          return true;
      });
  }

  const newTree = remover(JSON.parse(JSON.stringify(tree))); // On travaille sur une copie
  return { newTree, removedItem };
}

function findItemDeep(tree: TreeItem[], itemId: string): TreeItem | null {
  for (const item of tree) {
    if (item.id === itemId) return item;
    if (item.type === 'folder') {
      const found = findItemDeep(item.children, itemId);
      if (found) return found;
    }
  }
  return null;
}

function insertItemIntoTree(tree: TreeItem[], itemToInsert: TreeItem, overId: string | null): TreeItem[] {
  if (!overId) return [...tree, itemToInsert]; // Ajoute à la fin de la racine

  const { parent: overParent } = findItemAndParent(tree, overId) || {};
  const targetArray = overParent ? overParent.children : tree;
  const overIndex = targetArray.findIndex(item => item.id === overId);

  if (overIndex === -1) return [...tree, itemToInsert]; // Sécurité

  targetArray.splice(overIndex, 0, itemToInsert);
  return [...tree];
}

const addItemToTree = (tree: TreeItem[], newItem: TreeItem, parentId: string | null): TreeItem[] => {
  if (!parentId) {
    return [...tree, newItem];
  }
  return tree.map(item => {
    if (item.id === parentId && item.type === 'folder') {
      return { ...item, children: [...item.children, newItem] };
    }
    if (item.type === 'folder') {
      return { ...item, children: addItemToTree(item.children, newItem, parentId) };
    }
    return item;
  });
};

function findParent(tree: TreeItem[], itemId: string): FolderItem | null {
  for (const item of tree) {
      if (item.type === 'folder') {
          if (item.children.some(child => child.id === itemId)) {
              return item;
          }
          const foundParent = findParent(item.children, itemId);
          if (foundParent) return foundParent;
      }
  }
  return null;
}

const serializeTreeForStorage = (tree: TreeItem[]): string => {
    return JSON.stringify(tree, (key, value) => {
        if (value instanceof Map) {
            return { __type: 'Map', value: Array.from(value.entries()) };
        }
        return value;
    });
};

const parseTreeFromStorage = (storedTree: string): TreeItem[] => {
    return JSON.parse(storedTree, (key, value) => {
        if (value && value.__type === 'Map') {
            return new Map(value.value);
        }
        return value;
    });
};

const ensureDefaultAction = (actions: Action[]): Action[] => {
    if (actions.length === 0) {
      return [{ id: `custom-${Date.now()}`, name: 'Nouvelle Action', color: '#4CAF50' }];
    }
    return actions;
};

// --- INTERFACE DU STORE ZUSTAND ---
interface RangeState {
  handFrequencies: Map<string, HandFrequency[]>;
  customActions: Action[];
  actionMixes: ActionMix[];
  activeBrush: ActiveBrush | null;
  rangeTree: TreeItem[];
  selectedItemId: string | null;
  

  // Actions
  loadInitialState: () => void;
  setSelectedItem: (itemId: string | null) => void;
  updateHand: (hand: string, dragMode: 'add' | 'remove' | null) => void;
  resetGrid: () => void;
  addCustomAction: () => string;
  updateCustomAction: (actionId: string, updatedAction: Partial<Action>) => void;
  deleteCustomAction: (actionId: string) => void;
  addActionMix: () => void;
  updateActionMix: (mixId: string, updates: Partial<ActionMix>) => void;
  deleteActionMix: (mixId: string) => void;
  setActiveBrush: (brush: ActiveBrush | null) => void;
  addFolder: (name: string) => void;
  addRange: (name: string) => void;
  deleteItem: (itemId: string) => void;
  loadRange: (rangeId: string) => void;
  moveItem: (activeId: string, overId: string | null) => void;
  renameItem: (itemId: string, newName: string) => void;
}

// --- CRÉATION DU STORE ---
export const useRangeStore = create<RangeState>((set, get) => ({
  // --- ÉTAT INITIAL ---
  handFrequencies: new Map(),
  customActions: [],
  actionMixes: [],
  activeBrush: null,
  rangeTree: [],
  selectedItemId: null,

  // --- ACTIONS ---

  loadInitialState: () => {
    try {
      const storedActions = localStorage.getItem('defaultCustomActions');
      set({ customActions: ensureDefaultAction(storedActions ? JSON.parse(storedActions) : []) });
      const storedTree = localStorage.getItem('pokerRangeTree');
      if (storedTree) {
        set({ rangeTree: parseTreeFromStorage(storedTree) });
      }
    } catch (error) { console.error("Failed to load state from localStorage:", error); }
  },

  setSelectedItem: (itemId) => set({ selectedItemId: itemId }),
  resetGrid: () => set({ handFrequencies: new Map() }),

  moveItem: (activeId, overId) => {
    set(state => {
      const { rangeTree } = state;
      
      // 1. On retire l'élément déplacé de l'arbre et on le garde en mémoire
      const { newTree: treeWithoutActiveItem, removedItem: activeItem } = findAndRemoveItem(rangeTree, activeId);
      if (!activeItem) return {}; // Si l'item n'est pas trouvé, on ne fait rien

      let finalTree = treeWithoutActiveItem;
      
      // 2. On détermine où le réinsérer
      if (overId) {
          const overItem = findItemDeep(finalTree, overId); // (findItemDeep est une fonction que nous avions déjà)
          
          if (overItem && overItem.type === 'folder') {
              // Cas 1: On dépose DANS un dossier
              overItem.children.push(activeItem);
          } else {
              // Cas 2: On dépose SUR un autre item (pour réordonner ou sortir d'un dossier)
              const parent = findParent(finalTree, overId);
              const targetArray = parent ? parent.children : finalTree;
              const overIndex = targetArray.findIndex(item => item.id === overId);
              targetArray.splice(overIndex, 0, activeItem);
          }
      } else {
          // Cas 3: On dépose dans le vide -> on l'ajoute à la racine
          finalTree.push(activeItem);
      }

      // 3. On met à jour l'état
      localStorage.setItem('pokerRangeTree', serializeTreeForStorage(finalTree));
      return { rangeTree: finalTree };
    });
},

addFolder: (name) => {
  set(state => {
    const newFolder: FolderItem = { id: `folder-${Date.now()}`, type: 'folder', name, children: [] };
    const newTree = addItemToTree(state.rangeTree, newFolder, state.selectedItemId);
    localStorage.setItem('pokerRangeTree', serializeTreeForStorage(newTree));
    return { rangeTree: newTree };
  });
},

addRange: (name) => {
  if (!name || !name.trim()) return;

  // LOG 2: On inspecte l'état AU MOMENT PRÉCIS de la sauvegarde
  console.log("ADD_RANGE: Tentative de sauvegarde. Contenu actuel de handFrequencies :", get().handFrequencies);

  set(state => {
    const newRange: RangeItem = {
      id: `range-${Date.now()}`,
      type: 'range',
      name: name.trim(),
      handFrequencies: new Map(state.handFrequencies), // Copie de l'état
      customActions: [...state.customActions],
    };
    
    const newTree = addItemToTree(state.rangeTree, newRange, state.selectedItemId);
    
    localStorage.setItem('pokerRangeTree', serializeTreeForStorage(newTree));

    // LOG 3: On vérifie l'objet qui va être ajouté
    console.log("ADD_RANGE: Range créée avec les données suivantes :", newRange);

    return { rangeTree: newTree };
  });
},

deleteItem: (itemId) => {
  set(state => {
    const newTree = removeItemFromTree(state.rangeTree, itemId);
    localStorage.setItem('pokerRangeTree', serializeTreeForStorage(newTree));
    return {
      rangeTree: newTree,
      selectedItemId: state.selectedItemId === itemId ? null : state.selectedItemId
    };
  });
},

// NOUVELLE FONCTION POUR RENOMMER
renameItem: (itemId, newName) => {
  set(state => {
    const newTree = JSON.parse(JSON.stringify(state.rangeTree)); // Copie profonde
    const itemToRename = findItemDeep(newTree, itemId);
    if (itemToRename) {
      itemToRename.name = newName;
    }
    localStorage.setItem('pokerRangeTree', serializeTreeForStorage(newTree));
    return { rangeTree: newTree };
  });
},


  loadRange: (rangeId) => {
    const findRange = (tree: TreeItem[]): RangeItem | null => {
        for (const item of tree) {
            if (item.id === rangeId && item.type === 'range') return item;
            if (item.type === 'folder') {
                const found = findRange(item.children);
                if (found) return found;
            }
        }
        return null;
    }
    const rangeToLoad = findRange(get().rangeTree);
    if (rangeToLoad) {
        set({
            handFrequencies: new Map(rangeToLoad.handFrequencies),
            customActions: ensureDefaultAction(rangeToLoad.customActions || []),
            activeBrush: null,
        });
    } else {
        console.error("Range non trouvé !");
    }
  },

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
    set(state => ({
      customActions: state.customActions.filter(a => a.id !== actionId),
    }));
  },

  setActiveBrush: (brush) => set({ activeBrush: brush }),
    
  addActionMix: () => {
      const actions = get().customActions;
      if (actions.length === 0) return;
      const newMix: ActionMix = {
          id: `mix-${Date.now()}`,
          actions: [{ actionId: actions[0].id }],
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
          activeBrush: get().activeBrush?.id === mixId ? null : get().activeBrush,
      }));
  },

  updateHand: (hand, dragMode) => {
    const { handFrequencies, activeBrush, actionMixes } = get();
    if (!activeBrush) return;

    const newHandFrequencies = new Map(handFrequencies);

    if (activeBrush.type === 'simple') {
        const existingFreqs = newHandFrequencies.get(hand) || [];
        const existingIndex = existingFreqs.findIndex(f => f.actionId === activeBrush.id);
        set({ handFrequencies: newHandFrequencies });
        console.log("UPDATE_HAND: La grille contient maintenant", get().handFrequencies.size, "mains.");
        if (dragMode === 'add') {
            if (existingIndex === -1) {
                newHandFrequencies.set(hand, [{ actionId: activeBrush.id, frequency: 100 }]);
            }
        } else if (dragMode === 'remove') {
            if (existingIndex !== -1) {
                newHandFrequencies.delete(hand);
            }
        } else {
            if (existingIndex !== -1) {
                newHandFrequencies.delete(hand);
            } else {
                newHandFrequencies.set(hand, [{ actionId: activeBrush.id, frequency: 100 }]);
            }
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
}));

// Hook d'initialisation
export const useInitStore = () => {
    const loadInitialState = useRangeStore((state) => state.loadInitialState);
    useEffect(() => {
        loadInitialState();
    }, [loadInitialState]);
};