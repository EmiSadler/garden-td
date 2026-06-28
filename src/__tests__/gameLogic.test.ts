import { describe, it, expect } from 'vitest';
import { findTarget, getEnemyGridPos, applyDamageToEnemy, makePlacedTower, makeEnemy, collectDeadEnemies } from '../gameLogic';
import { getMapById } from '../maps';
import { computeGameConfig } from '../gameConfig';
import type { GameState } from '../types';

const MAP1 = getMapById(1);
const BASE_CONFIG = computeGameConfig(new Set());

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'wave',
    mapId: 1,
    wave: 1,
    gold: 200,
    lives: 3,
    enemiesKilledThisRun: 0,
    seedsThisRun: 0,
    petalsThisRun: 0,
    enemies: [],
    towers: [],
    pendingSpawns: [],
    spawnTimer: 0,
    prepTimer: 0,
    waveCountdownTimer: 0,
    selectedTowerType: null,
    selectedTowerId: null,
    ...overrides,
  };
}
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

describe('collectDeadEnemies', () => {
  it('awards 1 petal when a boss_snail is killed (not exited)', () => {
    const boss = { ...makeEnemy('boss_snail', ENTRY_SEG), hp: 0, exited: false };
    const state = makeMinimalState({ enemies: [boss] });
    const next = collectDeadEnemies(state, MAP1, BASE_CONFIG);
    expect(next.petalsThisRun).toBe(1);
  });

  it('does not award a petal when boss_snail exits', () => {
    const boss = { ...makeEnemy('boss_snail', ENTRY_SEG), hp: 0, exited: true };
    const state = makeMinimalState({ enemies: [boss] });
    const next = collectDeadEnemies(state, MAP1, BASE_CONFIG);
    expect(next.petalsThisRun).toBe(0);
  });

  it('awards 2 petals with boss_bounty config', () => {
    const bossConfig = { ...BASE_CONFIG, bossDropsPetals: 2 };
    const boss = { ...makeEnemy('boss_snail', ENTRY_SEG), hp: 0, exited: false };
    const state = makeMinimalState({ enemies: [boss] });
    const next = collectDeadEnemies(state, MAP1, bossConfig);
    expect(next.petalsThisRun).toBe(2);
  });

  it('rounds petals with map petalMultiplier applied', () => {
    const MAP3 = getMapById(3);
    const boss = { ...makeEnemy('boss_snail', 'cross_entry'), hp: 0, exited: false };
    const state = makeMinimalState({ enemies: [boss] });
    const next = collectDeadEnemies(state, MAP3, BASE_CONFIG);
    expect(next.petalsThisRun).toBe(Math.round(1 * MAP3.petalMultiplier));
  });

  it('does not award petals for non-boss kills', () => {
    const caterpillar = { ...makeEnemy('caterpillar', ENTRY_SEG), hp: 0, exited: false };
    const state = makeMinimalState({ enemies: [caterpillar] });
    const next = collectDeadEnemies(state, MAP1, BASE_CONFIG);
    expect(next.petalsThisRun).toBe(0);
  });
});
