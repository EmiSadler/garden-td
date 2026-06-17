import type { GridPos } from './types';

// S-curve path: entry left, exit right
export const PATH_WAYPOINTS: GridPos[] = [
  { col: 0,  row: 2  }, // entry
  { col: 4,  row: 2  }, // turn 1
  { col: 4,  row: 9  }, // turn 2
  { col: 15, row: 9  }, // turn 3
  { col: 15, row: 2  }, // turn 4
  { col: 19, row: 2  }, // exit (garden heart)
];

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

export function getEnemyPixelPos(
  progress: number,
  pathTiles: GridPos[],
  tileSize: number,
): { x: number; y: number } {
  const idx = Math.max(0, Math.min(Math.floor(progress), pathTiles.length - 2));
  const frac = progress - idx;
  const from = pathTiles[idx];
  const to = pathTiles[Math.min(idx + 1, pathTiles.length - 1)];
  return {
    x: (from.col + (to.col - from.col) * frac) * tileSize + tileSize / 2,
    y: (from.row + (to.row - from.row) * frac) * tileSize + tileSize / 2,
  };
}

// Pre-computed path tiles and fast lookup — used throughout the app
export const PATH_TILES = getPathTiles(PATH_WAYPOINTS);
export const PATH_TILE_SET = new Set(PATH_TILES.map(t => `${t.col},${t.row}`));

export function isTileOnPathFast(col: number, row: number): boolean {
  return PATH_TILE_SET.has(`${col},${row}`);
}
