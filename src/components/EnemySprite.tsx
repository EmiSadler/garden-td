import type { Enemy } from '../types';
import { BASE_ENEMY_STATS, TILE_SIZE } from '../constants';
import { getEnemyPixelPos, PATH_TILES } from '../mapData';

interface Props {
  enemy: Enemy;
}

export default function EnemySprite({ enemy }: Props) {
  const { x, y } = getEnemyPixelPos(enemy.progress, PATH_TILES, TILE_SIZE);
  const stats = BASE_ENEMY_STATS[enemy.type];
  const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
  const isBoss = enemy.type === 'boss_snail';

  return (
    <div
      className="absolute flex flex-col items-center pointer-events-none"
      style={{
        left: x - (isBoss ? 20 : 14),
        top: y - (isBoss ? 28 : 22),
        zIndex: 10,
      }}
    >
      <div style={{ height: 4, width: isBoss ? 40 : 28, background: '#374151', borderRadius: 2, marginBottom: 2 }}>
        <div style={{ height: '100%', width: `${hpPct * 100}%`, background: hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444', borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: isBoss ? 28 : 18 }} title={stats.label}>
        {stats.emoji}{isBoss && '👑'}
      </span>
    </div>
  );
}
