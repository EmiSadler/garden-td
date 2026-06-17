import { describe, it, expect } from 'vitest';
import { getPathTiles, isTileOnPath, getEnemyPixelPos, PATH_WAYPOINTS } from '../mapData';

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

describe('getEnemyPixelPos', () => {
  it('returns position at start of path for progress 0', () => {
    const tiles = getPathTiles(PATH_WAYPOINTS);
    const tileSize = 48;
    const pos = getEnemyPixelPos(0, tiles, tileSize);
    expect(pos.x).toBe(tiles[0].col * tileSize + tileSize / 2);
    expect(pos.y).toBe(tiles[0].row * tileSize + tileSize / 2);
  });

  it('interpolates between tiles', () => {
    const tiles = getPathTiles(PATH_WAYPOINTS);
    const tileSize = 48;
    const pos = getEnemyPixelPos(0.5, tiles, tileSize);
    const midX = ((tiles[0].col + tiles[1].col) / 2) * tileSize + tileSize / 2;
    const midY = ((tiles[0].row + tiles[1].row) / 2) * tileSize + tileSize / 2;
    expect(pos.x).toBeCloseTo(midX);
    expect(pos.y).toBeCloseTo(midY);
  });
});
