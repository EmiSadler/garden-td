import type { MapDef, PathSegment, GridPos } from './types';
import { getPathTiles } from './mapData';

// Convenience builder: converts a waypoint list into a full PathSegment object.
function seg(id: string, waypoints: GridPos[], nextSegmentIds: string[]): PathSegment {
  return { id, tiles: getPathTiles(waypoints), nextSegmentIds };
}

// ─── Map 1: Garden Path ───────────────────────────────────────────────────────
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
const MAP_3: MapDef = {
  id: 3,
  name: 'The Crossroads',
  difficulty: 'Hard',
  seedMultiplier: 1.7,
  petalMultiplier: 1.25,
  entrySegmentId: 'cross_entry',
  segments: [
    // Shared entry segment; splits into upper and lower branches at col 7.
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
const MAP_4: MapDef = {
  id: 4,
  name: 'The Labyrinth',
  difficulty: 'Hardest',
  seedMultiplier: 2.5,
  petalMultiplier: 1.5,
  entrySegmentId: 'lab_entry',
  segments: [
    // Entry splits into top/bottom lanes, each of which splits again into 2 sub-routes.
    seg('lab_entry', [
      { col: 0, row: 6 }, { col: 1, row: 6 }, { col: 2, row: 6 },
      { col: 3, row: 6 }, { col: 4, row: 6 },
    ], ['lab_top', 'lab_bot']),

    seg('lab_top', [
      { col: 5, row: 6 }, { col: 5, row: 5 }, { col: 5, row: 4 },
      { col: 5, row: 3 },
      { col: 6, row: 3 }, { col: 7, row: 3 }, { col: 8, row: 3 }, { col: 9, row: 3 },
    ], ['lab_tl', 'lab_tr']),

    seg('lab_bot', [
      { col: 5, row: 6 }, { col: 5, row: 7 }, { col: 5, row: 8 },
      { col: 5, row: 9 },
      { col: 6, row: 9 }, { col: 7, row: 9 }, { col: 8, row: 9 }, { col: 9, row: 9 },
    ], ['lab_bl', 'lab_br']),

    seg('lab_tl', [
      { col: 10, row: 3 }, { col: 10, row: 2 }, { col: 10, row: 1 },
      { col: 11, row: 1 }, { col: 12, row: 1 }, { col: 13, row: 1 },
      { col: 14, row: 1 }, { col: 15, row: 1 }, { col: 16, row: 1 },
      { col: 16, row: 2 }, { col: 16, row: 3 }, { col: 16, row: 4 },
      { col: 16, row: 5 }, { col: 16, row: 6 },
    ], ['lab_exit']),

    seg('lab_tr', [
      { col: 10, row: 3 },
      { col: 11, row: 3 }, { col: 12, row: 3 }, { col: 13, row: 3 },
      { col: 13, row: 4 }, { col: 13, row: 5 }, { col: 13, row: 6 },
      { col: 14, row: 6 }, { col: 15, row: 6 }, { col: 16, row: 6 },
    ], ['lab_exit']),

    seg('lab_bl', [
      { col: 10, row: 9 },
      { col: 11, row: 9 }, { col: 12, row: 9 }, { col: 13, row: 9 },
      { col: 13, row: 8 }, { col: 13, row: 7 }, { col: 13, row: 6 },
      { col: 14, row: 6 }, { col: 15, row: 6 }, { col: 16, row: 6 },
    ], ['lab_exit']),

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

// Looks up a map by its numeric id; throws if the id doesn't exist.
export function getMapById(id: number): MapDef {
  const map = MAPS.find(m => m.id === id);
  if (!map) throw new Error(`Map ${id} not found`);
  return map;
}

// Returns a Set<"col,row"> of every tile that belongs to any segment — used for fast
// O(1) path collision checks when placing towers.
export function getMapPathTileSet(map: MapDef): Set<string> {
  const set = new Set<string>();
  for (const seg of map.segments) {
    for (const tile of seg.tiles) {
      set.add(`${tile.col},${tile.row}`);
    }
  }
  return set;
}

// Returns the last tile of the terminal segment (the segment with no outgoing links).
// This is the tile that triggers an enemy exit when reached.
export function getMapExitTile(map: MapDef): GridPos {
  const terminal = map.segments.find(s => s.nextSegmentIds.length === 0);
  if (!terminal) throw new Error(`Map ${map.id} has no terminal segment`);
  return terminal.tiles[terminal.tiles.length - 1];
}

// Returns the first tile of the entry segment — used to position free starting towers nearby.
export function getMapEntryTile(map: MapDef): GridPos {
  const entry = map.segments.find(s => s.id === map.entrySegmentId);
  if (!entry) throw new Error(`Map ${map.id} entry segment not found`);
  return entry.tiles[0];
}

// Converts a segment ID + fractional progress value into a pixel position for smooth
// enemy rendering. Interpolates linearly between the two adjacent tiles.
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
