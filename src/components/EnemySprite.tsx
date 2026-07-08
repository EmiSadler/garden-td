import type { Enemy, MapDef } from '../types';
import { BASE_ENEMY_STATS, TILE_SIZE } from '../constants';
import { getEnemyPixelPos } from '../maps';

interface Props {
  enemy: Enemy;
  map: MapDef;
}

// Absolutely-positioned enemy sprite. Pixel position is interpolated each frame via
// getEnemyPixelPos so movement is smooth between tiles. Boss snails render larger with a crown.
export default function EnemySprite({ enemy, map }: Props) {
  const { x, y } = getEnemyPixelPos(enemy.segmentId, enemy.segmentProgress, map, TILE_SIZE);
  const stats = BASE_ENEMY_STATS[enemy.type];
  const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
  const isBoss = enemy.type === 'boss_snail';
  const isPoisoned = enemy.poisonTimer > 0;
  const isSlowed = enemy.slowTimer > 0;

  return (
    <div
      className="absolute flex flex-col items-center pointer-events-none"
      style={{ left: x - (isBoss ? 20 : 14), top: y - (isBoss ? 32 : 24), zIndex: 10 }}
    >
      {/* HP bar: green > 50%, amber > 25%, red below */}
      <div style={{ height: 4, width: isBoss ? 40 : 28, background: '#374151', borderRadius: 2, marginBottom: 1 }}>
        <div style={{
          height: '100%',
          width: `${hpPct * 100}%`,
          background: hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444',
          borderRadius: 2,
        }} />
      </div>
      {/* Debuff indicators shown above the sprite when active */}
      {(isPoisoned || isSlowed) && (
        <div style={{ fontSize: 8, lineHeight: 1, marginBottom: 1, display: 'flex', gap: 1 }}>
          {isPoisoned && <span>🧪</span>}
          {isSlowed && <span>🧊</span>}
        </div>
      )}
      <span style={{ fontSize: isBoss ? 28 : 18 }} title={stats.label}>
        {stats.emoji}{isBoss && '👑'}
      </span>
    </div>
  );
}
