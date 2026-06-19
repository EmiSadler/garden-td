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
