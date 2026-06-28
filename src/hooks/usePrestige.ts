import { useState, useCallback } from 'react';
import type { PrestigeTreeState, PrestigeConfig } from '../types';
import { computePrestigeConfig, canUnlockPrestigeNode, PRESTIGE_NODES } from '../gameConfig';

const STORAGE_KEY = 'garden_td_prestige';

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

function saveToStorage(state: PrestigeTreeState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    petals: state.petals,
    unlocked: [...state.unlocked],
  }));
}

export function usePrestige() {
  const [prestigeState, setPrestigeState] = useState<PrestigeTreeState>(loadFromStorage);

  const addPetals = useCallback((n: number) => {
    if (n <= 0) return;
    setPrestigeState(prev => {
      const next = { ...prev, petals: prev.petals + n };
      saveToStorage(next);
      return next;
    });
  }, []);

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

  // Caller must call addPetals(petalsThisRun) BEFORE calling prestige().
  // Returns the number of seeds the player keeps (based on current prestige config).
  const prestige = useCallback((currentSeeds: number): number => {
    const config = computePrestigeConfig(prestigeState.unlocked);
    return Math.floor(currentSeeds * config.seedSavingsRate);
  }, [prestigeState.unlocked]);

  const prestigeConfig: PrestigeConfig = computePrestigeConfig(prestigeState.unlocked);

  return { prestigeState, prestigeConfig, addPetals, unlockPrestigeNode, prestige };
}
