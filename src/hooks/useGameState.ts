import { useRef, useState, useEffect, useCallback } from 'react';
import type { GameState, TowerType, GameConfig } from '../types';
import { BASE_TOWER_STATS, SELL_REFUND } from '../constants';
import { tick, makePlacedTower } from '../gameLogic';
import { getMapById, getMapPathTileSet, getMapEntryTile } from '../maps';

function buildInitialState(config: GameConfig, mapId: number): GameState {
  const map = getMapById(mapId);
  const entryTile = getMapEntryTile(map);

  const initialTowers = config.startingFreeThorn
    ? [makePlacedTower('thorn_bush', entryTile.col + 1, entryTile.row - 1)]
    : [];

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

export function useGameState(config: GameConfig, mapId: number) {
  const mapRef = useRef(getMapById(mapId));
  const pathTileSetRef = useRef(getMapPathTileSet(mapRef.current));
  const stateRef = useRef<GameState>(buildInitialState(config, mapId));
  const [, setTick] = useState(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    mapRef.current = getMapById(mapId);
    pathTileSetRef.current = getMapPathTileSet(mapRef.current);
  }, [mapId]);

  useEffect(() => {
    const loop = (time: number) => {
      const dt = lastTimeRef.current !== undefined
        ? Math.min((time - lastTimeRef.current) / 1000, 0.05)
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

  const selectTowerType = useCallback((type: TowerType | null) => {
    stateRef.current = { ...stateRef.current, selectedTowerType: type, selectedTowerId: null };
    setTick(n => n + 1);
  }, []);

  const placeTower = useCallback((col: number, row: number) => {
    const s = stateRef.current;
    if (!s.selectedTowerType) return;
    if (pathTileSetRef.current.has(`${col},${row}`)) return;
    if (s.towers.some(t => t.col === col && t.row === row)) return;

    const stats = BASE_TOWER_STATS[s.selectedTowerType];
    const cost = Math.round(stats.cost * configRef.current.costMultiplier);
    if (s.gold < cost) return;

    const tower = makePlacedTower(s.selectedTowerType, col, row);
    stateRef.current = {
      ...s,
      gold: s.gold - cost,
      towers: [...s.towers, tower],
      selectedTowerType: null,
    };
    setTick(n => n + 1);
  }, []);

  const selectTower = useCallback((towerId: string | null) => {
    stateRef.current = { ...stateRef.current, selectedTowerType: null, selectedTowerId: towerId };
    setTick(n => n + 1);
  }, []);

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

  const restartRun = useCallback((newMapId?: number) => {
    const id = newMapId ?? mapRef.current.id;
    mapRef.current = getMapById(id);
    pathTileSetRef.current = getMapPathTileSet(mapRef.current);
    lastTimeRef.current = undefined;
    stateRef.current = buildInitialState(configRef.current, id);
    setTick(n => n + 1);
  }, []);

  return {
    state: stateRef.current,
    map: mapRef.current,
    selectTowerType,
    placeTower,
    selectTower,
    sellTower,
    restartRun,
  };
}
