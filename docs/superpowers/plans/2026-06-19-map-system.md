# Map System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded single-path system with a segment-based map engine supporting 4 maps (2 with branching paths) and a run-start map selection screen.

**Architecture:** Enemy position moves from a single `progress` float into `segmentId + segmentProgress + totalProgress`. A `MapDef` defines named `PathSegment`s that connect at junctions; enemies randomly pick a branch when a segment ends. All game-loop functions receive the active `MapDef` instead of a flat `GridPos[]`. Components receive the map's path tile set as a prop rather than importing a module-level constant. This is Phase 1 of 2; the Prestige system (Plan 2) builds on top.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, Vitest — no new dependencies.

---

## File Map

```
Modified:
  src/types.ts                  # Enemy: progress → segmentId/segmentProgress/totalProgress; add MapDef/PathSegment; GameState: add mapId
  src/mapData.ts                # Keep getPathTiles() utility; remove module-level PATH_TILES/PATH_TILE_SET; add segment helpers
  src/gameLogic.ts              # makeEnemy, getEnemyGridPos, findTarget, findTargetsInRadius, tickEnemyMovement all updated
  src/hooks/useGameState.ts     # Accept MapDef; pass to tick(); isTileOnPath from map; restartRun accepts mapId
  src/components/GameBoard.tsx  # Receive MapDef prop; compute path tile set from map
  src/components/GameTile.tsx   # Receive isOnPath/isExit/isEntry booleans instead of calling module fn
  src/components/EnemySprite.tsx # Segment-aware pixel position
  src/App.tsx                   # selectedMapId state; show MapSelectScreen when >1 map unlocked

Created:
  src/maps.ts                         # MapDef definitions for all 4 maps + helper functions
  src/components/MapSelectScreen.tsx  # Run-start map picker UI

Modified tests:
  src/__tests__/gameLogic.test.ts  # Update to new makeEnemy/getEnemyGridPos/findTarget API
  src/__tests__/mapData.test.ts    # Update: PATH_WAYPOINTS still exported, module constants removed
```

---

## Task 1: Update Types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Replace `src/types.ts` with this exact content**

```typescript
export type TowerType =
  | 'thorn_bush' | 'beehive' | 'sunflower' | 'sprinkler' | 'cactus'
  | 'mushroom' | 'venus_flytrap' | 'rose' | 'watering_can' | 'pumpkin' | 'oak_tree';

export type EnemyType = 'caterpillar' | 'ladybug' | 'snail' | 'boss_snail';

export type GamePhase = 'prep' | 'wave_countdown' | 'wave' | 'run_end';

export interface GridPos {
  col: number; // 0–19
  row: number; // 0–11
}

// A linear array of tiles forming one path segment
export interface PathSegment {
  id: string;
  tiles: GridPos[];
  nextSegmentIds: string[]; // empty array = this segment leads to the exit
}

export interface MapDef {
  id: number;
  name: string;
  difficulty: string;        // display label e.g. "Easiest", "Hard"
  seedMultiplier: number;
  petalMultiplier: number;
  segments: PathSegment[];
  entrySegmentId: string;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  segmentId: string;         // which segment the enemy is currently on
  segmentProgress: number;   // 0 to segment.tiles.length-1 within that segment
  totalProgress: number;     // total tiles traversed across all segments (used for targeting priority)
  hp: number;
  maxHp: number;
  speed: number;             // path-tiles per second
  slowTimer: number;
  activeSlowFactor: number;
  poisonTimer: number;
  poisonDps: number;
  stunTimer: number;
  reverseTimer: number;
  reverseImmunityTimer: number;
  exited?: boolean;
}

export interface PlacedTower {
  id: string;
  type: TowerType;
  col: number;
  row: number;
  cooldownTimer: number;
  incomeTimer: number;
  hp: number;
}

export interface EnemySpawn {
  type: EnemyType;
  delaySeconds: number;
}

export interface GameState {
  phase: GamePhase;
  mapId: number;             // which map this run is on
  wave: number;
  gold: number;
  lives: number;
  enemiesKilledThisRun: number;
  seedsThisRun: number;
  petalsThisRun: number;     // prestige petals earned this run (used by Plan 2)
  enemies: Enemy[];
  towers: PlacedTower[];
  pendingSpawns: EnemySpawn[];
  spawnTimer: number;
  prepTimer: number;
  waveCountdownTimer: number;
  selectedTowerType: TowerType | null;
  selectedTowerId: string | null;
}

export interface TowerStats {
  emoji: string;
  label: string;
  cost: number;
  damage: number;
  range: number;
  cooldown: number;
  aoe: boolean;
  aoeRadius: number;
  incomeAmount: number;
  incomeInterval: number;
  slowFactor: number;
  slowDuration: number;
  poisonDps: number;
  poisonDuration: number;
  stunDuration: number;
  reverseDuration: number;
}

export interface EnemyStats {
  emoji: string;
  label: string;
  hp: number;
  speed: number;
  goldReward: number;
}

export interface GameConfig {
  startingGold: number;
  startingLives: number;
  prepTime: number;
  extraGold: number;
  extraLives: number;
  costMultiplier: number;
  globalDamageMultiplier: number;
  globalSpeedMultiplier: number;
  thornDamageMultiplier: number;
  hiveRangeMultiplier: number;
  sunflowerIncomeMultiplier: number;
  sprinklerDurationMultiplier: number;
  cactusCritChance: number;
  startingFreeThorn: boolean;
  unlockedTowers: TowerType[];
  unlockedMapIds: number[];  // which maps the player can choose (starts as [1])
}

export interface TechNode {
  id: string;
  branch: 'roots' | 'species' | 'garden';
  position: number;
  name: string;
  description: string;
  cost: number;
}

export interface TechTreeState {
  seeds: number;
  unlocked: Set<string>;
}
```

- [ ] **Step 2: Run TypeScript check — expect many errors (types changed, implementations not updated yet)**

```bash
cd /Users/emily/Code/garden-td && npx tsc --noEmit 2>&1 | head -30
```

Expected: errors referencing `progress`, `pathTiles`, `unlockedMapIds` — these will be fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
cd /Users/emily/Code/garden-td
git add src/types.ts
git commit -m "refactor: update types for segment-based map system"
```

---

## Task 2: Create maps.ts

**Files:**
- Create: `src/maps.ts`

- [ ] **Step 1: Write `src/maps.ts`**

```typescript
import type { MapDef, PathSegment, GridPos } from './types';
import { getPathTiles } from './mapData';

function seg(id: string, waypoints: GridPos[], nextSegmentIds: string[]): PathSegment {
  return { id, tiles: getPathTiles(waypoints), nextSegmentIds };
}

// ─── Map 1: Garden Path ───────────────────────────────────────────────────────
// Original S-curve. Medium difficulty, baseline rewards.
const MAP_1: MapDef = {
  id: 1,
  name: 'Garden Path',
  difficulty: 'Medium',
  seedMultiplier: 1.0,
  petalMultiplier: 1.0,
  entrySegmentId: 'garden_main',
  segments: [
    seg('garden_main', [
      { col: 0,  row: 2 },
      { col: 4,  row: 2 },
      { col: 4,  row: 9 },
      { col: 15, row: 9 },
      { col: 15, row: 2 },
      { col: 19, row: 2 },
    ], []),
  ],
};

// ─── Map 2: The Gauntlet ──────────────────────────────────────────────────────
// Long winding path with many turns (~54 tiles). Easiest map — towers cover
// more ground per placement. Pays out 0.8× seeds.
const MAP_2: MapDef = {
  id: 2,
  name: 'The Gauntlet',
  difficulty: 'Easiest',
  seedMultiplier: 0.8,
  petalMultiplier: 1.0,
  entrySegmentId: 'gauntlet_main',
  segments: [
    seg('gauntlet_main', [
      { col: 0,  row: 1 },
      { col: 8,  row: 1 },
      { col: 8,  row: 5 },
      { col: 2,  row: 5 },
      { col: 2,  row: 9 },
      { col: 10, row: 9 },
      { col: 10, row: 5 },
      { col: 15, row: 5 },
      { col: 15, row: 9 },
      { col: 17, row: 9 },
      { col: 17, row: 2 },
      { col: 19, row: 2 },
    ], []),
  ],
};

// ─── Map 3: The Crossroads ────────────────────────────────────────────────────
// Entry → fork → upper or lower branch → shared exit. Hard: fewer tiles per
// branch means harder to cover both routes. 1.7× seeds, 1.25× petals.
//
// Layout (row 6 is the spine):
//   Entry (cols 0–7, row 6) → fork at col 8
//   Upper branch: col 8 row 6 → up to row 2 → right to col 15 → down to row 6
//   Lower branch: col 8 row 6 → down to row 10 → right to col 15 → up to row 6
//   Exit: col 16–19, row 6. Garden heart at (19,6).
const MAP_3: MapDef = {
  id: 3,
  name: 'The Crossroads',
  difficulty: 'Hard',
  seedMultiplier: 1.7,
  petalMultiplier: 1.25,
  entrySegmentId: 'cross_entry',
  segments: [
    seg('cross_entry', [
      { col: 0, row: 6 }, { col: 1, row: 6 }, { col: 2, row: 6 },
      { col: 3, row: 6 }, { col: 4, row: 6 }, { col: 5, row: 6 },
      { col: 6, row: 6 }, { col: 7, row: 6 },
    ], ['cross_upper', 'cross_lower']),

    seg('cross_upper', [
      { col: 8,  row: 6 }, { col: 8,  row: 5 }, { col: 8, row: 4 },
      { col: 8,  row: 3 }, { col: 8,  row: 2 },
      { col: 9,  row: 2 }, { col: 10, row: 2 }, { col: 11, row: 2 },
      { col: 12, row: 2 }, { col: 13, row: 2 }, { col: 14, row: 2 }, { col: 15, row: 2 },
      { col: 15, row: 3 }, { col: 15, row: 4 }, { col: 15, row: 5 }, { col: 15, row: 6 },
    ], ['cross_exit']),

    seg('cross_lower', [
      { col: 8,  row: 6  }, { col: 8,  row: 7  }, { col: 8, row: 8  },
      { col: 8,  row: 9  }, { col: 8,  row: 10 },
      { col: 9,  row: 10 }, { col: 10, row: 10 }, { col: 11, row: 10 },
      { col: 12, row: 10 }, { col: 13, row: 10 }, { col: 14, row: 10 }, { col: 15, row: 10 },
      { col: 15, row: 9  }, { col: 15, row: 8  }, { col: 15, row: 7  }, { col: 15, row: 6  },
    ], ['cross_exit']),

    seg('cross_exit', [
      { col: 16, row: 6 }, { col: 17, row: 6 },
      { col: 18, row: 6 }, { col: 19, row: 6 },
    ], []),
  ],
};

// ─── Map 4: The Labyrinth ─────────────────────────────────────────────────────
// Two sequential forks produce 4 distinct routes through the grid. Hardest map.
// 2.5× seeds, 1.5× petals.
//
// Fork 1 (col 4→5): top half vs bottom half
// Fork 2a (col 9→10): top → top-left (row 1) or top-right (row 3→6)
// Fork 2b (col 9→10): bot → bot-left (row 7→6) or bot-right (row 11)
// All 4 routes converge at col 16, row 6, then exit to col 19.
// Garden heart at (19,6).
const MAP_4: MapDef = {
  id: 4,
  name: 'The Labyrinth',
  difficulty: 'Hardest',
  seedMultiplier: 2.5,
  petalMultiplier: 1.5,
  entrySegmentId: 'lab_entry',
  segments: [
    seg('lab_entry', [
      { col: 0, row: 6 }, { col: 1, row: 6 }, { col: 2, row: 6 },
      { col: 3, row: 6 }, { col: 4, row: 6 },
    ], ['lab_top', 'lab_bot']),

    // Fork 2a: top half of grid
    seg('lab_top', [
      { col: 5, row: 6 }, { col: 5, row: 5 }, { col: 5, row: 4 },
      { col: 5, row: 3 },
      { col: 6, row: 3 }, { col: 7, row: 3 }, { col: 8, row: 3 }, { col: 9, row: 3 },
    ], ['lab_tl', 'lab_tr']),

    // Fork 2b: bottom half of grid
    seg('lab_bot', [
      { col: 5, row: 6 }, { col: 5, row: 7 }, { col: 5, row: 8 },
      { col: 5, row: 9 },
      { col: 6, row: 9 }, { col: 7, row: 9 }, { col: 8, row: 9 }, { col: 9, row: 9 },
    ], ['lab_bl', 'lab_br']),

    // Top-left route: swings up to row 1
    seg('lab_tl', [
      { col: 10, row: 3 }, { col: 10, row: 2 }, { col: 10, row: 1 },
      { col: 11, row: 1 }, { col: 12, row: 1 }, { col: 13, row: 1 },
      { col: 14, row: 1 }, { col: 15, row: 1 }, { col: 16, row: 1 },
      { col: 16, row: 2 }, { col: 16, row: 3 }, { col: 16, row: 4 },
      { col: 16, row: 5 }, { col: 16, row: 6 },
    ], ['lab_exit']),

    // Top-right route: cuts through the middle
    seg('lab_tr', [
      { col: 10, row: 3 },
      { col: 11, row: 3 }, { col: 12, row: 3 }, { col: 13, row: 3 },
      { col: 13, row: 4 }, { col: 13, row: 5 }, { col: 13, row: 6 },
      { col: 14, row: 6 }, { col: 15, row: 6 }, { col: 16, row: 6 },
    ], ['lab_exit']),

    // Bottom-left route: cuts through the middle
    seg('lab_bl', [
      { col: 10, row: 9 },
      { col: 11, row: 9 }, { col: 12, row: 9 }, { col: 13, row: 9 },
      { col: 13, row: 8 }, { col: 13, row: 7 }, { col: 13, row: 6 },
      { col: 14, row: 6 }, { col: 15, row: 6 }, { col: 16, row: 6 },
    ], ['lab_exit']),

    // Bottom-right route: swings down to row 11
    seg('lab_br', [
      { col: 10, row: 9  }, { col: 10, row: 10 }, { col: 10, row: 11 },
      { col: 11, row: 11 }, { col: 12, row: 11 }, { col: 13, row: 11 },
      { col: 14, row: 11 }, { col: 15, row: 11 }, { col: 16, row: 11 },
      { col: 16, row: 10 }, { col: 16, row: 9  }, { col: 16, row: 8  },
      { col: 16, row: 7  }, { col: 16, row: 6  },
    ], ['lab_exit']),

    seg('lab_exit', [
      { col: 17, row: 6 }, { col: 18, row: 6 }, { col: 19, row: 6 },
    ], []),
  ],
};

export const MAPS: MapDef[] = [MAP_1, MAP_2, MAP_3, MAP_4];

export function getMapById(id: number): MapDef {
  const map = MAPS.find(m => m.id === id);
  if (!map) throw new Error(`Map ${id} not found`);
  return map;
}

// All path tiles across all segments as a Set for O(1) tile lookup
export function getMapPathTileSet(map: MapDef): Set<string> {
  const set = new Set<string>();
  for (const seg of map.segments) {
    for (const tile of seg.tiles) {
      set.add(`${tile.col},${tile.row}`);
    }
  }
  return set;
}

// The last tile of any terminal segment (no nextSegmentIds) is the exit tile
export function getMapExitTile(map: MapDef): GridPos {
  const terminal = map.segments.find(s => s.nextSegmentIds.length === 0);
  if (!terminal) throw new Error(`Map ${map.id} has no terminal segment`);
  return terminal.tiles[terminal.tiles.length - 1];
}

// The first tile of the entry segment
export function getMapEntryTile(map: MapDef): GridPos {
  const entry = map.segments.find(s => s.id === map.entrySegmentId);
  if (!entry) throw new Error(`Map ${map.id} entry segment not found`);
  return entry.tiles[0];
}

// Pixel position of an enemy given segment + progress within that segment
export function getEnemyPixelPos(
  segmentId: string,
  segmentProgress: number,
  map: MapDef,
  tileSize: number,
): { x: number; y: number } {
  const segment = map.segments.find(s => s.id === segmentId);
  if (!segment) return { x: 0, y: 0 };
  const tiles = segment.tiles;
  const idx = Math.max(0, Math.min(Math.floor(segmentProgress), tiles.length - 2));
  const frac = segmentProgress - idx;
  const from = tiles[idx];
  const to = tiles[Math.min(idx + 1, tiles.length - 1)];
  return {
    x: (from.col + (to.col - from.col) * frac) * tileSize + tileSize / 2,
    y: (from.row + (to.row - from.row) * frac) * tileSize + tileSize / 2,
  };
}
```

- [ ] **Step 2: Run tests — will fail (types not yet updated in gameLogic)**

```bash
cd /Users/emily/Code/garden-td && npm test -- --run 2>&1 | tail -10
```

Expected: failures in gameLogic and mapData tests — that is correct at this stage.

- [ ] **Step 3: Commit**

```bash
cd /Users/emily/Code/garden-td
git add src/maps.ts
git commit -m "feat: add 4 map definitions with segment-based path system"
```

---

## Task 3: Update mapData.ts

**Files:**
- Modify: `src/mapData.ts`

Remove the module-level `PATH_TILES`, `PATH_TILE_SET`, and `isTileOnPathFast` exports — those are now per-map. Keep `PATH_WAYPOINTS` and `getPathTiles` since they're used by `maps.ts`.

- [ ] **Step 1: Read the current file**

```bash
cat /Users/emily/Code/garden-td/src/mapData.ts
```

- [ ] **Step 2: Replace `src/mapData.ts` with this content**

```typescript
import type { GridPos } from './types';

// PATH_WAYPOINTS kept for Map 1 reference and test compatibility
export const PATH_WAYPOINTS: GridPos[] = [
  { col: 0,  row: 2  },
  { col: 4,  row: 2  },
  { col: 4,  row: 9  },
  { col: 15, row: 9  },
  { col: 15, row: 2  },
  { col: 19, row: 2  },
];

// Expand an ordered list of waypoints into individual step-by-step tiles.
// Used by maps.ts to build PathSegment tile arrays.
export function getPathTiles(waypoints: GridPos[]): GridPos[] {
  const tiles: GridPos[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    if (from.row === to.row) {
      const step = to.col > from.col ? 1 : -1;
      for (let col = from.col; col !== to.col; col += step) {
        tiles.push({ col, row: from.row });
      }
    } else {
      const step = to.row > from.row ? 1 : -1;
      for (let row = from.row; row !== to.row; row += step) {
        tiles.push({ col: from.col, row });
      }
    }
  }
  tiles.push(waypoints[waypoints.length - 1]);
  return tiles;
}

export function isTileOnPath(col: number, row: number, pathTiles: GridPos[]): boolean {
  return pathTiles.some(t => t.col === col && t.row === row);
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/emily/Code/garden-td && npm test -- --run 2>&1 | tail -15
```

Expected: `mapData.test.ts` still passes (uses `getPathTiles` and `isTileOnPath` which are kept). `gameLogic.test.ts` still failing — fixed in Task 4.

- [ ] **Step 4: Commit**

```bash
cd /Users/emily/Code/garden-td
git add src/mapData.ts
git commit -m "refactor: remove module-level path constants from mapData, keep utilities"
```

---

## Task 4: Update mapData tests

**Files:**
- Modify: `src/__tests__/mapData.test.ts`

The `isTileOnPathFast` import is now removed. Update tests to import only what still exists.

- [ ] **Step 1: Replace `src/__tests__/mapData.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { getPathTiles, isTileOnPath, PATH_WAYPOINTS } from '../mapData';

describe('getPathTiles', () => {
  it('starts at the first waypoint', () => {
    const tiles = getPathTiles(PATH_WAYPOINTS);
    expect(tiles[0]).toEqual(PATH_WAYPOINTS[0]);
  });

  it('ends at the last waypoint', () => {
    const tiles = getPathTiles(PATH_WAYPOINTS);
    expect(tiles[tiles.length - 1]).toEqual(PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1]);
  });

  it('produces no duplicate consecutive tiles', () => {
    const tiles = getPathTiles(PATH_WAYPOINTS);
    for (let i = 1; i < tiles.length; i++) {
      const prev = tiles[i - 1];
      const curr = tiles[i];
      expect(prev.col === curr.col && prev.row === curr.row).toBe(false);
    }
  });

  it('only moves one tile at a time (no diagonal jumps)', () => {
    const tiles = getPathTiles(PATH_WAYPOINTS);
    for (let i = 1; i < tiles.length; i++) {
      const dc = Math.abs(tiles[i].col - tiles[i - 1].col);
      const dr = Math.abs(tiles[i].row - tiles[i - 1].row);
      expect(dc + dr).toBe(1);
    }
  });
});

describe('isTileOnPath', () => {
  it('returns true for the entry tile', () => {
    const tiles = getPathTiles(PATH_WAYPOINTS);
    const entry = PATH_WAYPOINTS[0];
    expect(isTileOnPath(entry.col, entry.row, tiles)).toBe(true);
  });

  it('returns false for a grass tile', () => {
    const tiles = getPathTiles(PATH_WAYPOINTS);
    expect(isTileOnPath(0, 0, tiles)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/emily/Code/garden-td && npm test -- --run src/__tests__/mapData.test.ts
```

Expected: 6 tests passing.

- [ ] **Step 3: Commit**

```bash
cd /Users/emily/Code/garden-td
git add src/__tests__/mapData.test.ts
git commit -m "test: update mapData tests after module constant removal"
```

---

## Task 5: Update gameLogic.ts

**Files:**
- Modify: `src/gameLogic.ts`

This is the largest change. Every function that previously received `pathTiles: GridPos[]` now receives `map: MapDef`. Enemy position is now `segmentId + segmentProgress + totalProgress`.

- [ ] **Step 1: Replace `src/gameLogic.ts` with this complete file**

```typescript
import { v4 as uuidv4 } from 'uuid';
import type { Enemy, EnemyType, PlacedTower, TowerType, GameState, GameConfig, GridPos } from './types';
import type { MapDef } from './types';
import { BASE_ENEMY_STATS, BASE_TOWER_STATS, WAVE_COUNTDOWN } from './constants';
import { buildWave, calculateSeeds } from './waveBuilder';
import { getMapExitTile } from './maps';

// ─── Factories ───────────────────────────────────────────────────────────────

export function makeEnemy(type: EnemyType, entrySegmentId: string, hpMultiplier = 1): Enemy {
  const stats = BASE_ENEMY_STATS[type];
  const hp = Math.round(stats.hp * hpMultiplier);
  return {
    id: uuidv4(),
    type,
    segmentId: entrySegmentId,
    segmentProgress: 0,
    totalProgress: 0,
    hp,
    maxHp: hp,
    speed: stats.speed,
    slowTimer: 0,
    poisonTimer: 0,
    poisonDps: 0,
    stunTimer: 0,
    reverseTimer: 0,
    reverseImmunityTimer: 0,
    activeSlowFactor: 0.5,
  };
}

export function makePlacedTower(type: TowerType, col: number, row: number): PlacedTower {
  return {
    id: uuidv4(),
    type,
    col,
    row,
    cooldownTimer: 0,
    incomeTimer: BASE_TOWER_STATS[type].incomeInterval,
    hp: Infinity,
  };
}

// ─── Targeting ───────────────────────────────────────────────────────────────

// Returns the current grid tile of an enemy
export function getEnemyGridPos(enemy: Enemy, map: MapDef): GridPos {
  const segment = map.segments.find(s => s.id === enemy.segmentId);
  if (!segment) return { col: 0, row: 0 };
  const idx = Math.max(0, Math.min(Math.floor(enemy.segmentProgress), segment.tiles.length - 1));
  return segment.tiles[idx];
}

// Returns the enemy with the highest totalProgress that is within range of the tower
export function findTarget(
  tower: PlacedTower,
  enemies: Enemy[],
  range: number,
  map: MapDef,
): Enemy | null {
  let best: Enemy | null = null;
  let bestTotal = -1;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.stunTimer > 0) continue;
    const ePos = getEnemyGridPos(enemy, map);
    const dist = Math.sqrt((ePos.col - tower.col) ** 2 + (ePos.row - tower.row) ** 2);
    if (dist <= range && enemy.totalProgress > bestTotal) {
      bestTotal = enemy.totalProgress;
      best = enemy;
    }
  }
  return best;
}

export function findTargetsInRadius(
  col: number,
  row: number,
  radius: number,
  enemies: Enemy[],
  map: MapDef,
): Enemy[] {
  return enemies.filter(e => {
    if (e.hp <= 0) return false;
    const ePos = getEnemyGridPos(e, map);
    const dist = Math.sqrt((ePos.col - col) ** 2 + (ePos.row - row) ** 2);
    return dist <= radius;
  });
}

// ─── Damage ──────────────────────────────────────────────────────────────────

export function applyDamageToEnemy(enemy: Enemy, damage: number): Enemy {
  return { ...enemy, hp: Math.max(0, enemy.hp - damage) };
}

// ─── Spawn logic ─────────────────────────────────────────────────────────────

function spawnDueEnemies(state: GameState, dt: number, map: MapDef): GameState {
  if (state.pendingSpawns.length === 0) return state;

  const newSpawnTimer = state.spawnTimer + dt;
  const pending = [...state.pendingSpawns];
  const newEnemies: Enemy[] = [];
  const hpMultiplier = Math.pow(1.1, state.wave - 1);

  let i = 0;
  while (i < pending.length && pending[i].delaySeconds <= newSpawnTimer) {
    newEnemies.push(makeEnemy(pending[i].type, map.entrySegmentId, hpMultiplier));
    i++;
  }

  return {
    ...state,
    spawnTimer: newSpawnTimer,
    pendingSpawns: pending.slice(i),
    enemies: [...state.enemies, ...newEnemies],
  };
}

// ─── Enemy movement ───────────────────────────────────────────────────────────

function tickEnemyMovement(state: GameState, dt: number, map: MapDef): GameState {
  const exitTile = getMapExitTile(map);

  const enemies = state.enemies.map(enemy => {
    if (enemy.hp <= 0) return enemy;

    const prevReverseTimer = enemy.reverseTimer;
    const newReverseTimer = Math.max(0, enemy.reverseTimer - dt);
    const newReverseImmunity = prevReverseTimer > 0 && newReverseTimer === 0
      ? 7
      : Math.max(0, enemy.reverseImmunityTimer - dt);

    let e = {
      ...enemy,
      slowTimer:            Math.max(0, enemy.slowTimer - dt),
      poisonTimer:          Math.max(0, enemy.poisonTimer - dt),
      stunTimer:            Math.max(0, enemy.stunTimer - dt),
      reverseTimer:         newReverseTimer,
      reverseImmunityTimer: newReverseImmunity,
    };

    // Apply poison even while stunned
    if (enemy.poisonTimer > 0) {
      e = applyDamageToEnemy(e, enemy.poisonDps * dt);
    }

    if (e.stunTimer > 0) return e;

    const effectiveSpeed = enemy.slowTimer > 0 ? e.speed * e.activeSlowFactor : e.speed;
    const isReversing = enemy.reverseTimer > 0;

    if (isReversing) {
      // Move backwards within the current segment only; clamp at 0
      const newProgress = Math.max(0, e.segmentProgress - effectiveSpeed * dt);
      return { ...e, segmentProgress: newProgress };
    }

    // Move forward
    const segment = map.segments.find(s => s.id === e.segmentId);
    if (!segment) return e;

    const newProgress = e.segmentProgress + effectiveSpeed * dt;
    const newTotal = e.totalProgress + effectiveSpeed * dt;

    if (newProgress >= segment.tiles.length - 1) {
      // Reached end of this segment
      if (segment.nextSegmentIds.length === 0) {
        // Terminal segment — enemy exits
        return {
          ...e,
          segmentProgress: segment.tiles.length - 1,
          totalProgress: newTotal,
          hp: 0,
          exited: true,
        };
      }
      // Pick a random next segment
      const nextId = segment.nextSegmentIds[
        Math.floor(Math.random() * segment.nextSegmentIds.length)
      ];
      return {
        ...e,
        segmentId: nextId,
        segmentProgress: 0,
        totalProgress: newTotal,
      };
    }

    return { ...e, segmentProgress: newProgress, totalProgress: newTotal };
  });

  return { ...state, enemies };
}

// ─── Tower attacks ────────────────────────────────────────────────────────────

function computeDamage(tower: PlacedTower, config: GameConfig, isCrit: boolean): number {
  const stats = BASE_TOWER_STATS[tower.type];
  let dmg = stats.damage * config.globalDamageMultiplier;
  if (tower.type === 'thorn_bush') dmg *= config.thornDamageMultiplier;
  if (isCrit) dmg *= 2;
  return dmg;
}

function tickTowerAttacks(
  state: GameState,
  dt: number,
  config: GameConfig,
  map: MapDef,
): GameState {
  let enemies = [...state.enemies];

  const towers = state.towers.map(tower => {
    const stats = BASE_TOWER_STATS[tower.type];

    if (tower.type === 'sunflower') return tower;

    const newCooldown = tower.cooldownTimer - dt * config.globalSpeedMultiplier;
    if (newCooldown > 0) return { ...tower, cooldownTimer: newCooldown };

    let range = stats.range;
    if (tower.type === 'beehive') range *= config.hiveRangeMultiplier;

    if (stats.aoe) {
      const targets = findTargetsInRadius(tower.col, tower.row, range, enemies, map);
      if (targets.length === 0) return tower;

      const damage = computeDamage(tower, config, false);
      const targetIds = new Set(targets.map(t => t.id));
      enemies = enemies.map(e => {
        if (!targetIds.has(e.id)) return e;
        let updated = damage > 0 ? applyDamageToEnemy(e, damage) : e;
        if (stats.slowFactor > 0) {
          const slowDur = stats.slowDuration * config.sprinklerDurationMultiplier;
          updated = { ...updated, slowTimer: Math.max(updated.slowTimer, slowDur), activeSlowFactor: stats.slowFactor };
        }
        return updated;
      });
      return { ...tower, cooldownTimer: stats.cooldown / config.globalSpeedMultiplier };
    }

    const target = findTarget(tower, enemies, range, map);
    if (!target) return tower;

    const isCrit = tower.type === 'cactus' && Math.random() < config.cactusCritChance;
    const damage = computeDamage(tower, config, isCrit);

    enemies = enemies.map(e => {
      if (e.id !== target.id) return e;
      let updated = damage > 0 ? applyDamageToEnemy(e, damage) : e;
      if (stats.poisonDps > 0)       updated = { ...updated, poisonTimer: stats.poisonDuration, poisonDps: stats.poisonDps };
      if (stats.stunDuration > 0)    updated = { ...updated, stunTimer: stats.stunDuration };
      if (stats.reverseDuration > 0 && updated.reverseTimer <= 0 && updated.reverseImmunityTimer <= 0) {
        updated = { ...updated, reverseTimer: stats.reverseDuration };
      }
      if (stats.slowFactor > 0) {
        const slowDur = stats.slowDuration * config.sprinklerDurationMultiplier;
        updated = { ...updated, slowTimer: Math.max(updated.slowTimer, slowDur), activeSlowFactor: stats.slowFactor };
      }
      return updated;
    });

    if (tower.type === 'watering_can') {
      const ePos = getEnemyGridPos(target, map);
      const chainTargets = findTargetsInRadius(ePos.col, ePos.row, 2, enemies.filter(e => e.id !== target.id), map).slice(0, 2);
      const chainIds = new Set(chainTargets.map(t => t.id));
      const slowDur = stats.slowDuration * config.sprinklerDurationMultiplier;
      enemies = enemies.map(e => {
        if (!chainIds.has(e.id)) return e;
        return { ...e, slowTimer: Math.max(e.slowTimer, slowDur), activeSlowFactor: stats.slowFactor };
      });
    }

    return { ...tower, cooldownTimer: stats.cooldown / config.globalSpeedMultiplier };
  });

  return { ...state, enemies, towers };
}

// ─── Sunflower income ─────────────────────────────────────────────────────────

function tickSunflowers(state: GameState, dt: number, config: GameConfig): GameState {
  let gold = state.gold;
  const towers = state.towers.map(tower => {
    if (tower.type !== 'sunflower') return tower;
    const stats = BASE_TOWER_STATS['sunflower'];
    const newTimer = tower.incomeTimer - dt;
    if (newTimer <= 0) {
      gold += Math.round(stats.incomeAmount * config.sunflowerIncomeMultiplier);
      return { ...tower, incomeTimer: stats.incomeInterval + newTimer };
    }
    return { ...tower, incomeTimer: newTimer };
  });
  return { ...state, gold, towers };
}

// ─── Collect dead/exited enemies ──────────────────────────────────────────────

function collectDeadEnemies(state: GameState, map: MapDef): GameState {
  let gold = state.gold;
  let enemiesKilledThisRun = state.enemiesKilledThisRun;
  let lives = state.lives;

  const survivors = state.enemies.filter(e => {
    if (e.hp > 0) return true;

    if (e.exited) {
      lives = Math.max(0, lives - 1);
    } else {
      const stats = BASE_ENEMY_STATS[e.type];
      gold += stats.goldReward;
      enemiesKilledThisRun += 1;
    }
    return false;
  });

  const seedsThisRun = Math.floor(
    calculateSeeds(state.wave, enemiesKilledThisRun) * map.seedMultiplier
  );

  return { ...state, enemies: survivors, gold, lives, enemiesKilledThisRun, seedsThisRun };
}

// ─── Phase ticks ─────────────────────────────────────────────────────────────

export function tickPrep(state: GameState, dt: number): GameState {
  const prepTimer = state.prepTimer - dt;
  if (prepTimer <= 0) {
    return {
      ...state,
      phase: 'wave',
      prepTimer: 0,
      pendingSpawns: buildWave(state.wave),
      spawnTimer: 0,
    };
  }
  return { ...state, prepTimer };
}

export function tickWaveCountdown(state: GameState, dt: number): GameState {
  const waveCountdownTimer = state.waveCountdownTimer - dt;
  if (waveCountdownTimer <= 0) {
    const nextWave = state.wave + 1;
    return {
      ...state,
      phase: 'wave',
      wave: nextWave,
      waveCountdownTimer: 0,
      pendingSpawns: buildWave(nextWave),
      spawnTimer: 0,
    };
  }
  return { ...state, waveCountdownTimer };
}

// ─── Main tick ────────────────────────────────────────────────────────────────

export function tick(
  state: GameState,
  dt: number,
  config: GameConfig,
  map: MapDef,
): GameState {
  if (state.lives <= 0 && state.phase !== 'run_end') {
    return { ...state, phase: 'run_end' };
  }

  if (state.phase === 'prep')           return tickPrep(state, dt);
  if (state.phase === 'wave_countdown') return tickWaveCountdown(state, dt);

  if (state.phase === 'wave') {
    let s = spawnDueEnemies(state, dt, map);
    s = tickEnemyMovement(s, dt, map);
    s = tickTowerAttacks(s, dt, config, map);
    s = tickSunflowers(s, dt, config);
    s = collectDeadEnemies(s, map);

    if (s.lives <= 0) return { ...s, phase: 'run_end' };

    if (s.pendingSpawns.length === 0 && s.enemies.length === 0) {
      const isBossWave = state.wave % 10 === 0;
      return {
        ...s,
        phase: 'wave_countdown',
        waveCountdownTimer: WAVE_COUNTDOWN,
        lives: isBossWave ? s.lives + 1 : s.lives,
      };
    }

    return s;
  }

  return state;
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/emily/Code/garden-td && npx tsc --noEmit 2>&1 | head -30
```

Expected: errors in `useGameState.ts`, test files, and components — all to be fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
cd /Users/emily/Code/garden-td
git add src/gameLogic.ts
git commit -m "refactor: gameLogic updated for segment-based map system"
```

---

## Task 6: Update gameLogic tests

**Files:**
- Modify: `src/__tests__/gameLogic.test.ts`

The test API changes: `makeEnemy` takes a segment ID string, `getEnemyGridPos` takes an enemy + map, `findTarget` takes a map instead of pathTiles.

- [ ] **Step 1: Replace `src/__tests__/gameLogic.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { findTarget, getEnemyGridPos, applyDamageToEnemy, makePlacedTower, makeEnemy } from '../gameLogic';
import { getMapById } from '../maps';

const MAP1 = getMapById(1);
const ENTRY_SEG = MAP1.entrySegmentId; // 'garden_main'

describe('getEnemyGridPos', () => {
  it('returns first tile of the entry segment for a fresh enemy', () => {
    const enemy = makeEnemy('caterpillar', ENTRY_SEG);
    const pos = getEnemyGridPos(enemy, MAP1);
    const segment = MAP1.segments.find(s => s.id === ENTRY_SEG)!;
    expect(pos).toEqual(segment.tiles[0]);
  });

  it('returns tile at integer progress within the segment', () => {
    const enemy = { ...makeEnemy('caterpillar', ENTRY_SEG), segmentProgress: 5 };
    const pos = getEnemyGridPos(enemy, MAP1);
    const segment = MAP1.segments.find(s => s.id === ENTRY_SEG)!;
    expect(pos).toEqual(segment.tiles[5]);
  });
});

describe('findTarget', () => {
  it('returns null when no enemies are in range', () => {
    const tower = makePlacedTower('thorn_bush', 0, 0);
    // Enemy far along the path (col ~4, row ~9 at progress ~20)
    const enemy = { ...makeEnemy('caterpillar', ENTRY_SEG), segmentProgress: 20 };
    expect(findTarget(tower, [enemy], 2, MAP1)).toBeNull();
  });

  it('returns the enemy with the highest totalProgress when multiple are in range', () => {
    const tower = makePlacedTower('thorn_bush', 1, 2);
    // Both enemies near the start of the S-curve (col 0-3, row 2)
    const close  = { ...makeEnemy('caterpillar', ENTRY_SEG), segmentProgress: 0.5, totalProgress: 0.5 };
    const closer = { ...makeEnemy('ladybug',     ENTRY_SEG), segmentProgress: 1.5, totalProgress: 1.5 };
    const result = findTarget(tower, [close, closer], 3, MAP1);
    expect(result?.id).toBe(closer.id);
  });

  it('ignores dead enemies (hp <= 0)', () => {
    const tower = makePlacedTower('thorn_bush', 1, 2);
    const dead = { ...makeEnemy('caterpillar', ENTRY_SEG), segmentProgress: 0.5, hp: 0 };
    expect(findTarget(tower, [dead], 3, MAP1)).toBeNull();
  });

  it('ignores stunned enemies', () => {
    const tower = makePlacedTower('thorn_bush', 1, 2);
    const stunned = { ...makeEnemy('caterpillar', ENTRY_SEG), segmentProgress: 0.5, stunTimer: 2 };
    expect(findTarget(tower, [stunned], 3, MAP1)).toBeNull();
  });
});

describe('applyDamageToEnemy', () => {
  it('reduces enemy hp by damage amount', () => {
    const enemy = makeEnemy('caterpillar', ENTRY_SEG);
    const result = applyDamageToEnemy(enemy, 10);
    expect(result.hp).toBe(enemy.hp - 10);
  });

  it('does not reduce hp below 0', () => {
    const enemy = makeEnemy('caterpillar', ENTRY_SEG);
    const result = applyDamageToEnemy(enemy, 9999);
    expect(result.hp).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/emily/Code/garden-td && npm test -- --run src/__tests__/gameLogic.test.ts
```

Expected: 8 tests passing.

- [ ] **Step 3: Run all tests**

```bash
cd /Users/emily/Code/garden-td && npm test -- --run
```

Expected: all 36 tests passing.

- [ ] **Step 4: Commit**

```bash
cd /Users/emily/Code/garden-td
git add src/__tests__/gameLogic.test.ts
git commit -m "test: update gameLogic tests for segment-based enemy API"
```

---

## Task 7: Update gameConfig.ts

**Files:**
- Modify: `src/gameConfig.ts`

Add `unlockedMapIds: [1]` to the base config. The prestige system will unlock more maps later.

- [ ] **Step 1: Read and update `src/gameConfig.ts`**

Find `computeGameConfig` and add `unlockedMapIds: [1]` to the base config object:

```typescript
const config: GameConfig = {
  startingGold: 200,
  startingLives: 3,
  prepTime: 10,
  extraGold: 0,
  extraLives: 0,
  costMultiplier: 1.0,
  globalDamageMultiplier: 1.0,
  globalSpeedMultiplier: 1.0,
  thornDamageMultiplier: 1.0,
  hiveRangeMultiplier: 1.0,
  sunflowerIncomeMultiplier: 1.0,
  sprinklerDurationMultiplier: 1.0,
  cactusCritChance: 0,
  startingFreeThorn: false,
  unlockedTowers: [...BASE_UNLOCKED_TOWERS],
  unlockedMapIds: [1],   // ← add this line
};
```

- [ ] **Step 2: Update the `computeGameConfig` test to expect `unlockedMapIds`**

In `src/__tests__/gameConfig.test.ts`, update the base values test:

```typescript
it('returns base values with empty unlock set', () => {
  const config = computeGameConfig(new Set());
  expect(config.startingGold).toBe(200);
  expect(config.startingLives).toBe(3);
  expect(config.prepTime).toBe(10);
  expect(config.unlockedTowers).toEqual(
    ['thorn_bush', 'beehive', 'sunflower', 'sprinkler', 'cactus']
  );
  expect(config.globalDamageMultiplier).toBe(1.0);
  expect(config.unlockedMapIds).toEqual([1]);
});
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/emily/Code/garden-td && npm test -- --run
```

Expected: all tests passing.

- [ ] **Step 4: Commit**

```bash
cd /Users/emily/Code/garden-td
git add src/gameConfig.ts src/__tests__/gameConfig.test.ts
git commit -m "feat: add unlockedMapIds to GameConfig (starts with map 1 only)"
```

---

## Task 8: Update useGameState.ts

**Files:**
- Modify: `src/hooks/useGameState.ts`

Accept a `mapId` parameter, look up the MapDef, use `getMapPathTileSet` for tower placement checks, and pass the map to `tick()`.

- [ ] **Step 1: Replace `src/hooks/useGameState.ts`**

```typescript
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

  // Update map when mapId changes (new run on a different map)
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
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/emily/Code/garden-td && npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: errors in App.tsx and components (to be fixed in Tasks 9–10).

- [ ] **Step 3: Commit**

```bash
cd /Users/emily/Code/garden-td
git add src/hooks/useGameState.ts
git commit -m "refactor: useGameState accepts mapId and passes MapDef to tick"
```

---

## Task 9: Update components

**Files:**
- Modify: `src/components/GameTile.tsx`
- Modify: `src/components/EnemySprite.tsx`
- Modify: `src/components/GameBoard.tsx`

Components no longer import module-level path constants. They receive map-derived data via props.

- [ ] **Step 1: Replace `src/components/GameTile.tsx`**

```tsx
import type { PlacedTower, TowerType } from '../types';
import { BASE_TOWER_STATS, TILE_SIZE } from '../constants';

interface Props {
  col: number;
  row: number;
  tower: PlacedTower | undefined;
  selectedTowerType: TowerType | null;
  isOnPath: boolean;
  isExit: boolean;
  isEntry: boolean;
  onClick: () => void;
  onTowerClick: (id: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function GameTile({
  col, row, tower, selectedTowerType,
  isOnPath, isExit, isEntry,
  onClick, onTowerClick, onMouseEnter, onMouseLeave,
}: Props) {
  const canPlace = !isOnPath && !tower && selectedTowerType;

  let bg = 'bg-green-700 hover:bg-green-600';
  if (isOnPath) bg = 'bg-amber-800';
  if (canPlace) bg = 'bg-green-500 cursor-pointer';

  return (
    <div
      className={`${bg} border border-green-900/30 flex items-center justify-center text-2xl select-none transition-colors`}
      style={{ width: TILE_SIZE, height: TILE_SIZE }}
      onClick={() => {
        if (tower) { onTowerClick(tower.id); return; }
        onClick();
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isExit && !tower && <span title="Garden Heart">🌷</span>}
      {isEntry && !tower && <span className="opacity-40 text-sm">▶</span>}
      {tower && (
        <span title={BASE_TOWER_STATS[tower.type].label} className="cursor-pointer hover:scale-110 transition-transform">
          {BASE_TOWER_STATS[tower.type].emoji}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/components/EnemySprite.tsx`**

```tsx
import type { Enemy } from '../types';
import type { MapDef } from '../types';
import { BASE_ENEMY_STATS, TILE_SIZE } from '../constants';
import { getEnemyPixelPos } from '../maps';

interface Props {
  enemy: Enemy;
  map: MapDef;
}

export default function EnemySprite({ enemy, map }: Props) {
  const { x, y } = getEnemyPixelPos(enemy.segmentId, enemy.segmentProgress, map, TILE_SIZE);
  const stats = BASE_ENEMY_STATS[enemy.type];
  const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
  const isBoss = enemy.type === 'boss_snail';
  const isPoisoned = enemy.poisonTimer > 0;

  return (
    <div
      className="absolute flex flex-col items-center pointer-events-none"
      style={{ left: x - (isBoss ? 20 : 14), top: y - (isBoss ? 32 : 24), zIndex: 10 }}
    >
      {/* Health bar */}
      <div style={{ height: 4, width: isBoss ? 40 : 28, background: '#374151', borderRadius: 2, marginBottom: 1 }}>
        <div style={{
          height: '100%',
          width: `${hpPct * 100}%`,
          background: hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444',
          borderRadius: 2,
        }} />
      </div>
      {/* Poison indicator */}
      {isPoisoned && (
        <div style={{ fontSize: 8, lineHeight: 1, marginBottom: 1 }}>☠️</div>
      )}
      <span style={{ fontSize: isBoss ? 28 : 18 }} title={stats.label}>
        {stats.emoji}{isBoss && '👑'}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/components/GameBoard.tsx`**

```tsx
import { useState } from 'react';
import type { GameState, MapDef } from '../types';
import { GRID_COLS, GRID_ROWS, TILE_SIZE, BASE_TOWER_STATS } from '../constants';
import { getMapPathTileSet, getMapExitTile, getMapEntryTile } from '../maps';
import GameTile from './GameTile';
import EnemySprite from './EnemySprite';

interface Props {
  state: GameState;
  map: MapDef;
  onTileClick: (col: number, row: number) => void;
  onTowerClick: (id: string) => void;
}

interface RangeRing {
  col: number;
  row: number;
  range: number;
  color: string;
}

export default function GameBoard({ state, map, onTileClick, onTowerClick }: Props) {
  const [hoveredPos, setHoveredPos] = useState<{ col: number; row: number } | null>(null);

  const pathTileSet = getMapPathTileSet(map);
  const exitTile = getMapExitTile(map);
  const entryTile = getMapEntryTile(map);
  const towerByPos = new Map(state.towers.map(t => [`${t.col},${t.row}`, t]));

  const rangeRings: RangeRing[] = [];
  if (hoveredPos) {
    const hoveredTower = towerByPos.get(`${hoveredPos.col},${hoveredPos.row}`);
    if (hoveredTower) {
      const stats = BASE_TOWER_STATS[hoveredTower.type];
      if (stats.range > 0) {
        rangeRings.push({ col: hoveredTower.col, row: hoveredTower.row, range: stats.range, color: 'rgba(99,102,241,0.25)' });
      }
    } else if (state.selectedTowerType && !pathTileSet.has(`${hoveredPos.col},${hoveredPos.row}`)) {
      const stats = BASE_TOWER_STATS[state.selectedTowerType];
      if (stats.range > 0) {
        rangeRings.push({ col: hoveredPos.col, row: hoveredPos.row, range: stats.range, color: 'rgba(250,204,21,0.25)' });
      }
    }
  }

  return (
    <div className="relative overflow-hidden" style={{ width: GRID_COLS * TILE_SIZE, height: GRID_ROWS * TILE_SIZE }}>
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, ${TILE_SIZE}px)` }}>
        {Array.from({ length: GRID_ROWS }, (_, row) =>
          Array.from({ length: GRID_COLS }, (_, col) => (
            <GameTile
              key={`${col}-${row}`}
              col={col}
              row={row}
              tower={towerByPos.get(`${col},${row}`)}
              selectedTowerType={state.selectedTowerType}
              isOnPath={pathTileSet.has(`${col},${row}`)}
              isExit={exitTile.col === col && exitTile.row === row}
              isEntry={entryTile.col === col && entryTile.row === row}
              onClick={() => onTileClick(col, row)}
              onTowerClick={onTowerClick}
              onMouseEnter={() => setHoveredPos({ col, row })}
              onMouseLeave={() => setHoveredPos(null)}
            />
          ))
        )}
      </div>

      {rangeRings.map((ring, i) => (
        <div
          key={i}
          className="absolute pointer-events-none rounded-full border-2"
          style={{
            left: (ring.col + 0.5) * TILE_SIZE - ring.range * TILE_SIZE,
            top:  (ring.row + 0.5) * TILE_SIZE - ring.range * TILE_SIZE,
            width: ring.range * TILE_SIZE * 2,
            height: ring.range * TILE_SIZE * 2,
            background: ring.color,
            borderColor: ring.color.replace('0.25', '0.6'),
            zIndex: 5,
          }}
        />
      ))}

      {state.enemies.map(enemy => (
        <EnemySprite key={enemy.id} enemy={enemy} map={map} />
      ))}

      {state.selectedTowerType && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-green-400 opacity-50" />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
cd /Users/emily/Code/garden-td && npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: only App.tsx errors remain.

- [ ] **Step 5: Commit**

```bash
cd /Users/emily/Code/garden-td
git add src/components/GameTile.tsx src/components/EnemySprite.tsx src/components/GameBoard.tsx
git commit -m "refactor: components receive MapDef and map-derived booleans as props"
```

---

## Task 10: MapSelectScreen + App.tsx wiring

**Files:**
- Create: `src/components/MapSelectScreen.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/components/MapSelectScreen.tsx`**

```tsx
import type { MapDef } from '../types';
import { MAPS } from '../maps';

interface Props {
  unlockedMapIds: number[];
  onSelect: (mapId: number) => void;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  'Easiest': 'text-green-400',
  'Medium':  'text-yellow-400',
  'Hard':    'text-orange-400',
  'Hardest': 'text-red-400',
};

export default function MapSelectScreen({ unlockedMapIds, onSelect }: Props) {
  const availableMaps = MAPS.filter(m => unlockedMapIds.includes(m.id));

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-white mb-2">Choose Your Garden</h1>
      <p className="text-green-400 text-sm mb-8">Each map has different difficulty and rewards</p>

      <div className="grid grid-cols-1 gap-4 w-full max-w-xl">
        {availableMaps.map(map => (
          <button
            key={map.id}
            onClick={() => onSelect(map.id)}
            className="bg-green-800 hover:bg-green-700 border border-green-600 hover:border-green-400 rounded-xl p-5 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white">{map.name}</h2>
              <span className={`text-sm font-semibold ${DIFFICULTY_COLOR[map.difficulty] ?? 'text-white'}`}>
                {map.difficulty}
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <span className="text-green-300">🌱 {map.seedMultiplier}× seeds</span>
              <span className="text-pink-300">🌸 {map.petalMultiplier}× petals</span>
              {map.segments.some(s => s.nextSegmentIds.length > 1) && (
                <span className="text-yellow-300">⚡ Branching paths</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { useState } from 'react';
import { useTechTree } from './hooks/useTechTree';
import { useGameState } from './hooks/useGameState';
import GameBoard from './components/GameBoard';
import HUD from './components/HUD';
import TowerPanel from './components/TowerPanel';
import TowerInfoModal from './components/TowerInfoModal';
import RunEndOverlay from './components/RunEndOverlay';
import TechTreeOverlay from './components/TechTreeOverlay';
import MapSelectScreen from './components/MapSelectScreen';

export default function App() {
  const { techTree, gameConfig, addSeeds, unlockNode } = useTechTree();
  const [selectedMapId, setSelectedMapId] = useState<number | null>(
    gameConfig.unlockedMapIds.length === 1 ? 1 : null
  );
  const { state, map, selectTowerType, placeTower, selectTower, sellTower, restartRun } =
    useGameState(gameConfig, selectedMapId ?? 1);

  const [showTechTree, setShowTechTree] = useState(false);
  const [techTreeOpenedFromRunEnd, setTechTreeOpenedFromRunEnd] = useState(false);
  const [seedsAwarded, setSeedsAwarded] = useState(false);

  // Show map select if more than 1 map is unlocked and none chosen yet
  if (selectedMapId === null) {
    return (
      <MapSelectScreen
        unlockedMapIds={gameConfig.unlockedMapIds}
        onSelect={id => setSelectedMapId(id)}
      />
    );
  }

  const selectedTower = state.selectedTowerId
    ? state.towers.find(t => t.id === state.selectedTowerId)
    : undefined;

  const handleOpenTechTree = () => {
    if (!seedsAwarded) { addSeeds(state.seedsThisRun); setSeedsAwarded(true); }
    setTechTreeOpenedFromRunEnd(true);
    setShowTechTree(true);
  };

  const handleRestartRun = () => {
    if (!seedsAwarded) { addSeeds(state.seedsThisRun); setSeedsAwarded(true); }
    setSeedsAwarded(false);
    // If multiple maps unlocked, go back to map select; otherwise restart same map
    if (gameConfig.unlockedMapIds.length > 1) {
      setSelectedMapId(null);
    } else {
      restartRun(selectedMapId);
    }
  };

  const handleCloseTechTree = () => {
    setShowTechTree(false);
    setTechTreeOpenedFromRunEnd(false);
    if (techTreeOpenedFromRunEnd) {
      setSeedsAwarded(false);
      if (gameConfig.unlockedMapIds.length > 1) {
        setSelectedMapId(null);
      } else {
        restartRun(selectedMapId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-4">
      <div className="relative flex flex-col" style={{ border: '2px solid #166534', borderRadius: 8 }}>
        <HUD state={state} />

        <div className="relative">
          <GameBoard
            state={state}
            map={map}
            onTileClick={(col, row) => {
              if (state.selectedTowerType) placeTower(col, row);
              else selectTower(null);
            }}
            onTowerClick={id => selectTower(id)}
          />

          {selectedTower && (
            <TowerInfoModal
              tower={selectedTower}
              config={gameConfig}
              onSell={() => sellTower(selectedTower.id)}
              onClose={() => selectTower(null)}
            />
          )}

          {state.phase === 'run_end' && (
            <RunEndOverlay
              wave={state.wave}
              enemiesKilled={state.enemiesKilledThisRun}
              seedsEarned={state.seedsThisRun}
              onOpenTechTree={handleOpenTechTree}
              onRestart={handleRestartRun}
            />
          )}
        </div>

        <TowerPanel
          gold={state.gold}
          selectedTowerType={state.selectedTowerType}
          config={gameConfig}
          onSelect={selectTowerType}
        />
      </div>

      <div className="mt-4 flex gap-4 items-center">
        <button
          onClick={() => setShowTechTree(true)}
          className="text-green-400 hover:text-green-200 text-sm underline"
        >
          🌱 Tech Tree ({techTree.seeds} seeds)
        </button>
        {gameConfig.unlockedMapIds.length > 1 && (
          <button
            onClick={() => setSelectedMapId(null)}
            className="text-green-400 hover:text-green-200 text-sm underline"
          >
            🗺️ Change Map
          </button>
        )}
      </div>

      {showTechTree && (
        <TechTreeOverlay
          techTree={techTree}
          onUnlock={unlockNode}
          onClose={handleCloseTechTree}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check — expect clean**

```bash
cd /Users/emily/Code/garden-td && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Run all tests**

```bash
cd /Users/emily/Code/garden-td && npm test -- --run
```

Expected: all 36 tests passing.

- [ ] **Step 5: Build check**

```bash
cd /Users/emily/Code/garden-td && npm run build
```

Expected: clean build.

- [ ] **Step 6: Manual playtest checklist**

```bash
npm run dev
```

Open http://localhost:5173. Verify:
- [ ] Game loads directly on Map 1 (only 1 map unlocked → skip map select)
- [ ] Path renders as the original S-curve (dirt tiles)
- [ ] Entry ▶ at col 0, row 2; exit 🌷 at col 19, row 2
- [ ] Enemies spawn at entry and march along the path
- [ ] Enemies take the correct single route (no branching on Map 1)
- [ ] Towers place and attack; range rings appear on hover
- [ ] Run ends, seeds awarded correctly
- [ ] Tech Tree accessible; "Change Map" button hidden (only 1 map unlocked)

Map 2 only works once prestige unlocks it (Plan 2). To test manually now, temporarily change `unlockedMapIds: [1]` to `[1, 2, 3, 4]` in `src/gameConfig.ts`, confirm:
- [ ] Map select screen appears on app load
- [ ] Map 2 (The Gauntlet) shows ~54 tiles of winding path
- [ ] Map 3 (The Crossroads) — enemies split at fork, some take upper branch, some take lower
- [ ] Map 4 (The Labyrinth) — enemies take 4 different routes
- [ ] "Change Map" button appears in footer when multiple maps available
- [ ] Reverting to `[1]` restores original behaviour

- [ ] **Step 7: Commit**

```bash
cd /Users/emily/Code/garden-td
git add src/components/MapSelectScreen.tsx src/App.tsx
git commit -m "feat: add MapSelectScreen and wire multi-map support into App"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ 4 maps: Garden Path, The Gauntlet, The Crossroads, The Labyrinth
- ✅ Maps 1 & 2 single path; Map 3 one fork; Map 4 two forks = 4 routes
- ✅ Map difficulty & seed/petal multipliers defined
- ✅ Map selection screen shown when >1 map unlocked; skipped when only Map 1
- ✅ Segment-based enemy routing with random branch choice at forks
- ✅ Tower targeting uses `totalProgress` for "furthest along" across segments
- ✅ Reversing enemies stay within their current segment (clamped at 0)
- ✅ `calculateSeeds` applies map's `seedMultiplier`
- ✅ `GameConfig.unlockedMapIds` added (starts as `[1]`, Plan 2 will add more)
- ✅ `GameState.petalsThisRun` field added (placeholder for Plan 2)
- ✅ EnemySprite shows poison indicator (☠️ when `poisonTimer > 0`)

**Not in this plan (Plan 2):**
- Prestige petals dropped by bosses
- Prestige tree & unlocking maps 2–4
- HUD prestige button

**Known behaviour note:** The starting free Thorn Bush position uses `entryTile.col + 1, entryTile.row - 1` — this places it adjacent to the entry on each map rather than hardcoding (1, 2). If this tile is on the path or off-grid for some map, it will silently not place (the `placeTower` guard catches this). Test during the manual playtest for each map.
