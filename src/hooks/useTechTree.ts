import { useState, useCallback } from 'react';
import type { TechTreeState } from '../types';
import { TECH_NODES, canUnlockNode } from '../gameConfig';

const STORAGE_KEY = 'garden_td_tech_tree';

// Reads the tech tree from localStorage; returns a blank state if the key is missing or corrupt.
function loadFromStorage(): TechTreeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { seeds: 0, unlocked: new Set() };
    const parsed = JSON.parse(raw);
    return { seeds: parsed.seeds ?? 0, unlocked: new Set(parsed.unlocked ?? []) };
  } catch {
    return { seeds: 0, unlocked: new Set() };
  }
}

// Serialises the tech tree state to localStorage after every mutation.
// Converts the Set to an array so JSON.stringify can handle it.
function saveToStorage(state: TechTreeState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    seeds: state.seeds,
    unlocked: [...state.unlocked],
  }));
}

// Manages the player's persistent tech tree (seed balance + unlocked nodes).
// techNodeCostMultiplier comes from the prestige tree (quick_study node reduces it to 0.9).
export function useTechTree(techNodeCostMultiplier = 1.0) {
  const [techTree, setTechTree] = useState<TechTreeState>(loadFromStorage);

  // Adds seeds to the balance (called at run end with the seeds earned that run).
  const addSeeds = useCallback((amount: number) => {
    setTechTree(prev => {
      const next = { ...prev, seeds: prev.seeds + amount };
      saveToStorage(next);
      return next;
    });
  }, []);

  // Attempts to purchase a node: validates cost (with prestige multiplier applied),
  // branch prerequisites, and that the node isn't already owned.
  const unlockNode = useCallback((nodeId: string) => {
    setTechTree(prev => {
      const node = TECH_NODES.find(n => n.id === nodeId);
      if (!node) return prev;
      const actualCost = Math.round(node.cost * techNodeCostMultiplier);
      if (prev.seeds < actualCost) return prev;
      if (!canUnlockNode(nodeId, prev.unlocked)) return prev;
      if (prev.unlocked.has(nodeId)) return prev;

      const unlocked = new Set(prev.unlocked);
      unlocked.add(nodeId);
      const next = { seeds: prev.seeds - actualCost, unlocked };
      saveToStorage(next);
      return next;
    });
  }, [techNodeCostMultiplier]);

  // Wipes all unlocks and sets the seed balance to keptSeeds (called during prestige reset).
  const resetWithSeeds = useCallback((keptSeeds: number) => {
    setTechTree(() => {
      const next = { seeds: keptSeeds, unlocked: new Set<string>() };
      saveToStorage(next);
      return next;
    });
  }, []);

  return { techTree, addSeeds, unlockNode, resetWithSeeds };
}
