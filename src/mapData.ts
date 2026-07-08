import type { GridPos } from './types';

// PATH_WAYPOINTS kept for Map 1 reference and test compatibility.
export const PATH_WAYPOINTS: GridPos[] = [
  { col: 0,  row: 2  },
  { col: 4,  row: 2  },
  { col: 4,  row: 9  },
  { col: 15, row: 9  },
  { col: 15, row: 2  },
  { col: 19, row: 2  },
];

// Expand an ordered list of corner waypoints into every individual tile the path passes through.
// Walks horizontally or vertically between each adjacent pair, then appends the final tile.
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

// Returns true if the given grid cell is occupied by the path (used to block tower placement).
export function isTileOnPath(col: number, row: number, pathTiles: GridPos[]): boolean {
  return pathTiles.some(t => t.col === col && t.row === row);
}
