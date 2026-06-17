import { describe, it, expect } from 'vitest';
import { findTarget, getEnemyGridPos, applyDamageToEnemy, makePlacedTower, makeEnemy } from '../gameLogic';
import { PATH_TILES } from '../mapData';

describe('getEnemyGridPos', () => {
  it('returns first path tile for progress 0', () => {
    expect(getEnemyGridPos(0, PATH_TILES)).toEqual(PATH_TILES[0]);
  });

  it('returns the correct tile for integer progress', () => {
    expect(getEnemyGridPos(5, PATH_TILES)).toEqual(PATH_TILES[5]);
  });
});

describe('findTarget', () => {
  it('returns null when no enemies are in range', () => {
    const tower = makePlacedTower('thorn_bush', 0, 0);
    const enemy = makeEnemy('caterpillar', 20);
    expect(findTarget(tower, [enemy], 2, PATH_TILES)).toBeNull();
  });

  it('returns the enemy in range furthest along the path', () => {
    const tower = makePlacedTower('thorn_bush', 1, 2);
    const close  = makeEnemy('caterpillar', 0.5);
    const closer = makeEnemy('ladybug', 1.5);
    const result = findTarget(tower, [close, closer], 3, PATH_TILES);
    expect(result?.id).toBe(closer.id);
  });

  it('ignores dead enemies (hp <= 0)', () => {
    const tower = makePlacedTower('thorn_bush', 1, 2);
    const dead = { ...makeEnemy('caterpillar', 0.5), hp: 0 };
    expect(findTarget(tower, [dead], 3, PATH_TILES)).toBeNull();
  });

  it('ignores stunned enemies', () => {
    const tower = makePlacedTower('thorn_bush', 1, 2);
    const stunned = { ...makeEnemy('caterpillar', 0.5), stunTimer: 2 };
    expect(findTarget(tower, [stunned], 3, PATH_TILES)).toBeNull();
  });
});

describe('applyDamageToEnemy', () => {
  it('reduces enemy hp by damage amount', () => {
    const enemy = makeEnemy('caterpillar', 0);
    const result = applyDamageToEnemy(enemy, 10);
    expect(result.hp).toBe(enemy.hp - 10);
  });

  it('does not reduce hp below 0', () => {
    const enemy = makeEnemy('caterpillar', 0);
    const result = applyDamageToEnemy(enemy, 9999);
    expect(result.hp).toBe(0);
  });
});
