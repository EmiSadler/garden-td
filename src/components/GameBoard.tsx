import { useState, useEffect, useRef } from 'react';
import type { GameState, MapDef } from '../types';
import { GRID_COLS, GRID_ROWS, TILE_SIZE, BASE_TOWER_STATS } from '../constants';
import { getMapPathTileSet, getMapExitTile, getMapEntryTile } from '../maps';
import GameTile from './GameTile';
import EnemySprite from './EnemySprite';

interface AoeRing {
  id: string;
  col: number;
  row: number;
  range: number;
  color: string;
}

const AOE_TOWER_TYPES = new Set(['beehive', 'sprinkler', 'oak_tree']);

const AOE_RING_COLOR: Record<string, string> = {
  beehive:  'rgba(251, 191, 36,  0.55)',
  sprinkler:'rgba(96,  165, 250, 0.55)',
  oak_tree: 'rgba(134, 239, 172, 0.55)',
};

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
  const [aoeRings, setAoeRings] = useState<AoeRing[]>([]);
  const prevFireCountsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const newRings: AoeRing[] = [];
    for (const tower of state.towers) {
      if (!AOE_TOWER_TYPES.has(tower.type)) continue;
      const prev = prevFireCountsRef.current.get(tower.id) ?? 0;
      if (tower.fireCount > prev) {
        newRings.push({
          id: `${tower.id}-${tower.fireCount}`,
          col: tower.col,
          row: tower.row,
          range: BASE_TOWER_STATS[tower.type].range,
          color: AOE_RING_COLOR[tower.type],
        });
      }
      prevFireCountsRef.current.set(tower.id, tower.fireCount);
    }
    if (newRings.length === 0) return;
    setAoeRings(prev => [...prev, ...newRings]);
    const ids = new Set(newRings.map(r => r.id));
    const timer = setTimeout(() => setAoeRings(prev => prev.filter(r => !ids.has(r.id))), 400);
    return () => clearTimeout(timer);
  }, [state.towers]);

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

      {aoeRings.map(ring => {
        const diameter = ring.range * TILE_SIZE * 2;
        return (
          <div
            key={ring.id}
            className="absolute pointer-events-none rounded-full animate-aoe-ring"
            style={{
              left:   (ring.col + 0.5) * TILE_SIZE - ring.range * TILE_SIZE,
              top:    (ring.row + 0.5) * TILE_SIZE - ring.range * TILE_SIZE,
              width:  diameter,
              height: diameter,
              border: `3px solid ${ring.color}`,
              zIndex: 6,
            }}
          />
        );
      })}

      {state.enemies.map(enemy => (
        <EnemySprite key={enemy.id} enemy={enemy} map={map} />
      ))}

      {state.selectedTowerType && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-green-400 opacity-50" />
      )}
    </div>
  );
}
