import { useState, useCallback } from 'react';
import type { TechTreeState } from '../types';
import { TECH_NODES, computeGameConfig, canUnlockNode, DEFAULT_PRESTIGE_CONFIG } from '../gameConfig';

const STORAGE_KEY = 'garden_td_tech_tree';

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

function saveToStorage(state: TechTreeState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    seeds: state.seeds,
    unlocked: [...state.unlocked],
  }));
}

export function useTechTree(techNodeCostMultiplier = 1.0) {
  const [techTree, setTechTree] = useState<TechTreeState>(loadFromStorage);

  const addSeeds = useCallback((amount: number) => {
    setTechTree(prev => {
      const next = { ...prev, seeds: prev.seeds + amount };
      saveToStorage(next);
      return next;
    });
  }, []);

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

  const resetWithSeeds = useCallback((keptSeeds: number) => {
    setTechTree(() => {
      const next = { seeds: keptSeeds, unlocked: new Set<string>() };
      saveToStorage(next);
      return next;
    });
  }, []);

  // Uses DEFAULT_PRESTIGE_CONFIG; App.tsx overrides with real prestige config in Task 9
  const gameConfig = computeGameConfig(techTree.unlocked, DEFAULT_PRESTIGE_CONFIG);

  return { techTree, gameConfig, addSeeds, unlockNode, resetWithSeeds };
}
