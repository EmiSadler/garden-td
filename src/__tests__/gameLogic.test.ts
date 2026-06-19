import { describe, it, expect } from 'vitest';
import { findTarget, getEnemyGridPos, applyDamageToEnemy, makePlacedTower, makeEnemy } from '../gameLogic';
import { getMapById } from '../maps';

const MAP1 = getMapById(1);
const ENTRY_SEG = MAP1.entrySegmentId; // 'garden_main'

describe('getEnemyGridPos', () => {
  it('returns first tile of the entry segment for a fresh enemy', () => {
    const enemy = makeEnemy('caterpillar', ENTRY_SEG);
    const pos = getEnemyGridPos(enemy, MAP1);
    const segment = MAP1.segments.find(s => s.id === ENTRY_SEG)!;
    expect(pos).toEqual(segment.tiles[0]);
  });

  it('returns tile at integer progress within the segment', () => {
    const enemy = { ...makeEnemy('caterpillar', ENTRY_SEG), segmentProgress: 5 };
    const pos = getEnemyGridPos(enemy, MAP1);
    const segment = MAP1.segments.find(s => s.id === ENTRY_SEG)!;
    expect(pos).toEqual(segment.tiles[5]);
  });
});

describe('findTarget', () => {
  it('returns null when no enemies are in range', () => {
    const tower = makePlacedTower('thorn_bush', 0, 0);
    const enemy = { ...makeEnemy('caterpillar', ENTRY_SEG), segmentProgress: 20 };
    expect(findTarget(tower, [enemy], 2, MAP1)).toBeNull();
  });

  it('returns the enemy with the highest totalProgress when multiple are in range', () => {
    const tower = makePlacedTower('thorn_bush', 1, 2);
    const close  = { ...makeEnemy('caterpillar', ENTRY_SEG), segmentProgress: 0.5, totalProgress: 0.5 };
    const closer = { ...makeEnemy('ladybug',     ENTRY_SEG), segmentProgress: 1.5, totalProgress: 1.5 };
    const result = findTarget(tower, [close, closer], 3, MAP1);
    expect(result?.id).toBe(closer.id);
  });

  it('ignores dead enemies (hp <= 0)', () => {
    const tower = makePlacedTower('thorn_bush', 1, 2);
    const dead = { ...makeEnemy('caterpillar', ENTRY_SEG), segmentProgress: 0.5, hp: 0 };
    expect(findTarget(tower, [dead], 3, MAP1)).toBeNull();
  });

  it('ignores stunned enemies', () => {
    const tower = makePlacedTower('thorn_bush', 1, 2);
    const stunned = { ...makeEnemy('caterpillar', ENTRY_SEG), segmentProgress: 0.5, stunTimer: 2 };
    expect(findTarget(tower, [stunned], 3, MAP1)).toBeNull();
  });
});

describe('applyDamageToEnemy', () => {
  it('reduces enemy hp by damage amount', () => {
    const enemy = makeEnemy('caterpillar', ENTRY_SEG);
    const result = applyDamageToEnemy(enemy, 10);
    expect(result.hp).toBe(enemy.hp - 10);
  });

  it('does not reduce hp below 0', () => {
    const enemy = makeEnemy('caterpillar', ENTRY_SEG);
    const result = applyDamageToEnemy(enemy, 9999);
    expect(result.hp).toBe(0);
  });
});
