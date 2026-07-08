import { useState, useCallback } from 'react';
import type { PrestigeTreeState } from '../types';
import { computePrestigeConfig, canUnlockPrestigeNode, PRESTIGE_NODES } from '../gameConfig';

const STORAGE_KEY = 'garden_td_prestige';

// Reads prestige state from localStorage; returns a blank state if missing or corrupt.
function loadFromStorage(): PrestigeTreeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { petals: 0, unlocked: new Set() };
    const parsed = JSON.parse(raw);
    return { petals: parsed.petals ?? 0, unlocked: new Set(parsed.unlocked ?? []) };
  } catch {
    return { petals: 0, unlocked: new Set() };
  }
}

// Serialises prestige state to localStorage after every mutation.
function saveToStorage(state: PrestigeTreeState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    petals: state.petals,
    unlocked: [...state.unlocked],
  }));
}

// Manages the player's prestige tree (petal balance + unlocked prestige nodes).
// Prestige nodes persist forever — they survive the tech tree wipe on each prestige.
export function usePrestige() {
  const [prestigeState, setPrestigeState] = useState<PrestigeTreeState>(loadFromStorage);

  // Adds petals to the balance (called at run end or when confirming a prestige).
  // Skips silently if n ≤ 0 to avoid spurious state updates.
  const addPetals = useCallback((n: number) => {
    if (n <= 0) return;
    setPrestigeState(prev => {
      const next = { ...prev, petals: prev.petals + n };
      saveToStorage(next);
      return next;
    });
  }, []);

  // Attempts to purchase a prestige node: delegates eligibility check to canUnlockPrestigeNode
  // which enforces AND/OR prerequisites and petal cost.
  const unlockPrestigeNode = useCallback((nodeId: string) => {
    setPrestigeState(prev => {
      if (!canUnlockPrestigeNode(nodeId, prev.unlocked, prev.petals)) return prev;
      const nodeDef = PRESTIGE_NODES.find(n => n.id === nodeId)!;
      const unlocked = new Set(prev.unlocked);
      unlocked.add(nodeId);
      const next = { petals: prev.petals - nodeDef.cost, unlocked };
      saveToStorage(next);
      return next;
    });
  }, []);

  // Calculates how many seeds the player keeps after a prestige.
  // Caller must call addPetals(petalsThisRun) BEFORE calling prestige() so the
  // petal balance is correct if any seed-savings node was just purchased.
  const prestige = useCallback((currentSeeds: number): number => {
    const config = computePrestigeConfig(prestigeState.unlocked);
    return Math.floor(currentSeeds * config.seedSavingsRate);
  }, [prestigeState.unlocked]);

  return { prestigeState, addPetals, unlockPrestigeNode, prestige };
}
