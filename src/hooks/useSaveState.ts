import type { GameState } from '../types';

const SAVE_KEY = 'garden_td_save';

export interface SaveData {
  state: GameState;
  mapId: number;
}

// Reads a saved game from localStorage. Returns null if no save exists, the save is corrupt,
// or the saved phase is run_end (nothing to continue).
export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (!data.state || data.state.phase === 'run_end') return null;
    return data;
  } catch {
    return null;
  }
}

// Persists the current game state. Skips run_end — there's nothing to continue.
export function writeSave(state: GameState, mapId: number): void {
  if (state.phase === 'run_end') return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ state, mapId }));
  } catch {
    // localStorage may be full or unavailable; silently skip
  }
}

// Removes the save file — called on run_end and Start New Game.
export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
