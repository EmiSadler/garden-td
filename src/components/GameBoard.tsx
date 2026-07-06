import { useState, useEffect, useRef } from 'react';
import type { Enemy, GameState, MapDef } from '../types';
import { GRID_COLS, GRID_ROWS, TILE_SIZE, BASE_ENEMY_STATS, BASE_TOWER_STATS } from '../constants';
import { getMapPathTileSet, getMapExitTile, getMapEntryTile, getEnemyPixelPos } from '../maps';
import GameTile from './GameTile';
import EnemySprite from './EnemySprite';

interface AoeRing {
  id: string;
  col: number;
  row: number;
  range: number;
  color: string;
}

interface DeathPop {
  id: string;
  x: number;
  y: number;
  emoji: string;
}

interface GoldFloat {
  id: string;
  x: number;
  y: number;
  amount: number;
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
  const [deathPops, setDeathPops] = useState<DeathPop[]>([]);
  const [goldFloats, setGoldFloats] = useState<GoldFloat[]>([]);
  const [lifeFlashKey, setLifeFlashKey] = useState(0);
  const prevFireCountsRef = useRef<Map<string, number>>(new Map());
  const prevEnemiesRef = useRef<Map<string, Enemy>>(new Map());

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

  useEffect(() => {
    const currentIds = new Set(state.enemies.map(e => e.id));
    const newPops: DeathPop[] = [];
    const newGold: GoldFloat[] = [];
    let exitCount = 0;

    for (const [id, enemy] of prevEnemiesRef.current) {
      if (currentIds.has(id)) continue;
      const { x, y } = getEnemyPixelPos(enemy.segmentId, enemy.segmentProgress, map, TILE_SIZE);
      if (enemy.exited) {
        exitCount++;
      } else {
        const stats = BASE_ENEMY_STATS[enemy.type];
        newPops.push({ id: `pop-${id}`, x, y, emoji: stats.emoji });
        newGold.push({ id: `gold-${id}`, x, y, amount: stats.goldReward });
      }
    }

    prevEnemiesRef.current = new Map(state.enemies.map(e => [e.id, e]));

    const timers: ReturnType<typeof setTimeout>[] = [];

    if (newPops.length > 0) {
      setDeathPops(prev => [...prev, ...newPops]);
      const ids = new Set(newPops.map(p => p.id));
      timers.push(setTimeout(() => setDeathPops(prev => prev.filter(p => !ids.has(p.id))), 400));
    }
    if (newGold.length > 0) {
      setGoldFloats(prev => [...prev, ...newGold]);
      const ids = new Set(newGold.map(g => g.id));
      timers.push(setTimeout(() => setGoldFloats(prev => prev.filter(g => !ids.has(g.id))), 750));
    }
    if (exitCount > 0) {
      setLifeFlashKey(k => k + 1);
    }

    if (timers.length > 0) return () => timers.forEach(clearTimeout);
  }, [state.enemies, map]);

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

      {deathPops.map(pop => (
        <div
          key={pop.id}
          className="absolute pointer-events-none animate-death-pop"
          style={{ left: pop.x - 14, top: pop.y - 14, fontSize: 20, zIndex: 15 }}
        >
          {pop.emoji}
        </div>
      ))}

      {goldFloats.map(g => (
        <div
          key={g.id}
          className="absolute pointer-events-none animate-float-gold font-bold text-yellow-300 text-xs"
          style={{ left: g.x - 12, top: g.y - 24, zIndex: 16 }}
        >
          +{g.amount}g
        </div>
      ))}

      {lifeFlashKey > 0 && (
        <div
          key={lifeFlashKey}
          className="absolute inset-0 pointer-events-none animate-life-flash"
          style={{ background: 'rgba(239, 68, 68, 1)', zIndex: 20 }}
        />
      )}

      {state.selectedTowerType && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-green-400 opacity-50" />
      )}
    </div>
  );
}
