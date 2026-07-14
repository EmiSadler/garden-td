import { useRef, useState, useEffect, useCallback } from 'react';
import type { GameState, TowerType, GameConfig, PlacedTower } from '../types';
import { BASE_TOWER_STATS, SELL_REFUND } from '../constants';
import { tick, makePlacedTower } from '../gameLogic';
import { getMapById, getMapPathTileSet, getMapEntryTile } from '../maps';
import type { SaveData } from './useSaveState';

// Candidate grid offsets for placing free starting towers adjacent to the entry tile.
// Tried in order until a valid non-path slot is found for each tower.
const FREE_TOWER_SLOTS = [
  { dCol: 1, dRow: -1 },
  { dCol: 1, dRow:  1 },
  { dCol: 2, dRow: -1 },
  { dCol: 2, dRow:  1 },
  { dCol: 3, dRow: -1 },
];

// Constructs the zero-state for a fresh run: places any free starting towers and
// fills in all counters/timers at their initial values.
function buildInitialState(config: GameConfig, mapId: number): GameState {
  const map = getMapById(mapId);
  const entryTile = getMapEntryTile(map);
  const pathSet = getMapPathTileSet(map);

  const initialTowers: PlacedTower[] = [];
  let slotIdx = 0;
  for (const type of config.startingFreeTowers) {
    while (slotIdx < FREE_TOWER_SLOTS.length) {
      const { dCol, dRow } = FREE_TOWER_SLOTS[slotIdx++];
      const col = entryTile.col + dCol;
      const row = entryTile.row + dRow;
      if (col >= 0 && col < 20 && row >= 0 && row < 12 && !pathSet.has(`${col},${row}`)) {
        initialTowers.push(makePlacedTower(type, col, row));
        break;
      }
    }
  }

  return {
    phase: 'prep',
    mapId,
    wave: 1,
    gold: config.startingGold + config.extraGold,
    lives: config.startingLives + config.extraLives,
    enemiesKilledThisRun: 0,
    seedsThisRun: 0,
    petalsThisRun: 0,
    enemies: [],
    towers: initialTowers,
    pendingSpawns: [],
    spawnTimer: 0,
    prepTimer: config.prepTime,
    waveCountdownTimer: 0,
    selectedTowerType: null,
    selectedTowerId: null,
  };
}

// Owns the requestAnimationFrame game loop and all per-run state.
// GameState lives in a ref (not React state) to avoid re-render overhead;
// setTick forces a single re-render per frame so components read stateRef.current.
export function useGameState(config: GameConfig, mapId: number) {
  const mapRef = useRef(getMapById(mapId));
  const pathTileSetRef = useRef(getMapPathTileSet(mapRef.current));
  const stateRef = useRef<GameState>(buildInitialState(config, mapId));
  const [, setTick] = useState(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const configRef = useRef(config);
  configRef.current = config;
  const speedRef = useRef(1);
  const [speed, setSpeedState] = useState(1);

  // Exposes speed changes to the UI while keeping speedRef in sync for the RAF loop.
  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  // Keep map and path set in sync when the player switches maps.
  useEffect(() => {
    mapRef.current = getMapById(mapId);
    pathTileSetRef.current = getMapPathTileSet(mapRef.current);
  }, [mapId]);

  // The core RAF loop. dt is capped at 50ms to prevent large jumps after tab switches.
  // Speed multiplier is applied to dt so towers and enemies scale uniformly.
  useEffect(() => {
    const loop = (time: number) => {
      const dt = lastTimeRef.current !== undefined
        ? Math.min((time - lastTimeRef.current) / 1000, 0.05) * speedRef.current
        : 0;
      lastTimeRef.current = time;

      const s = stateRef.current;
      if (s.phase !== 'run_end') {
        stateRef.current = tick(s, dt, configRef.current, mapRef.current);
        setTick(n => n + 1);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Sets the tower type to place next; clears any selected placed tower.
  const selectTowerType = useCallback((type: TowerType | null) => {
    stateRef.current = { ...stateRef.current, selectedTowerType: type, selectedTowerId: null };
    setTick(n => n + 1);
  }, []);

  // Places the selected tower type at (col, row) if the tile is free, on-grid, and affordable.
  // Returns true if placement succeeded (caller can use this to trigger sounds).
  const placeTower = useCallback((col: number, row: number): boolean => {
    const s = stateRef.current;
    if (!s.selectedTowerType) return false;
    if (pathTileSetRef.current.has(`${col},${row}`)) return false;
    if (s.towers.some(t => t.col === col && t.row === row)) return false;

    const stats = BASE_TOWER_STATS[s.selectedTowerType];
    const cost = Math.round(stats.cost * configRef.current.costMultiplier);
    if (s.gold < cost) return false;

    const tower = makePlacedTower(s.selectedTowerType, col, row);
    stateRef.current = {
      ...s,
      gold: s.gold - cost,
      towers: [...s.towers, tower],
      selectedTowerType: null,
    };
    setTick(n => n + 1);
    return true;
  }, []);

  // Selects a placed tower by id (to show the TowerInfoModal); clears tower type selection.
  const selectTower = useCallback((towerId: string | null) => {
    stateRef.current = { ...stateRef.current, selectedTowerType: null, selectedTowerId: towerId };
    setTick(n => n + 1);
  }, []);

  // Removes a placed tower and refunds 50% of its (multiplied) cost.
  const sellTower = useCallback((towerId: string) => {
    const s = stateRef.current;
    const tower = s.towers.find(t => t.id === towerId);
    if (!tower) return;
    const stats = BASE_TOWER_STATS[tower.type];
    const refund = Math.round(stats.cost * configRef.current.costMultiplier * SELL_REFUND);
    stateRef.current = {
      ...s,
      gold: s.gold + refund,
      towers: s.towers.filter(t => t.id !== towerId),
      selectedTowerId: null,
    };
    setTick(n => n + 1);
  }, []);

  // Restores game state from a save file, resuming where the player left off.
  const loadGame = useCallback((saveData: SaveData) => {
    mapRef.current = getMapById(saveData.mapId);
    pathTileSetRef.current = getMapPathTileSet(mapRef.current);
    lastTimeRef.current = undefined;
    stateRef.current = { ...saveData.state, selectedTowerType: null, selectedTowerId: null };
    speedRef.current = 1;
    setSpeedState(1);
    setTick(n => n + 1);
  }, []);

  // Resets all game state for a new run, optionally switching to a different map.
  const restartRun = useCallback((newMapId?: number) => {
    const id = newMapId ?? mapRef.current.id;
    mapRef.current = getMapById(id);
    pathTileSetRef.current = getMapPathTileSet(mapRef.current);
    lastTimeRef.current = undefined;
    stateRef.current = buildInitialState(configRef.current, id);
    speedRef.current = 1;
    setSpeedState(1);
    setTick(n => n + 1);
  }, []);

  return {
    state: stateRef.current,
    map: mapRef.current,
    speed,
    setSpeed,
    selectTowerType,
    placeTower,
    selectTower,
    sellTower,
    restartRun,
    loadGame,
  };
}
