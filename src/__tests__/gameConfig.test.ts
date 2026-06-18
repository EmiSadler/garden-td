import { describe, it, expect } from 'vitest';
import { computeGameConfig, canUnlockNode, TECH_NODES } from '../gameConfig';

describe('computeGameConfig', () => {
  it('returns base values with empty unlock set', () => {
    const config = computeGameConfig(new Set());
    expect(config.startingGold).toBe(200);
    expect(config.startingLives).toBe(3);
    expect(config.prepTime).toBe(10);
    expect(config.unlockedTowers).toEqual(
      ['thorn_bush', 'beehive', 'sunflower', 'sprinkler', 'cactus']
    );
    expect(config.globalDamageMultiplier).toBe(1.0);
  });

  it('applies compost: +30 extra gold', () => {
    const config = computeGameConfig(new Set(['compost']));
    expect(config.extraGold).toBe(30);
  });

  it('applies root_network: +10% global damage', () => {
    const config = computeGameConfig(new Set(['root_network']));
    expect(config.globalDamageMultiplier).toBeCloseTo(1.1);
  });

  it('applies fertile_soil: cost multiplier 0.9', () => {
    const config = computeGameConfig(new Set(['fertile_soil']));
    expect(config.costMultiplier).toBeCloseTo(0.9);
  });

  it('unlocks mushroom when spore_cloud is unlocked', () => {
    const config = computeGameConfig(new Set(['spore_cloud']));
    expect(config.unlockedTowers).toContain('mushroom');
  });

  it('extends prep time to 20s with early_bloom', () => {
    const config = computeGameConfig(new Set(['early_bloom']));
    expect(config.prepTime).toBe(20);
  });
});

describe('canUnlockNode', () => {
  it('allows unlocking first node in a branch with nothing unlocked', () => {
    expect(canUnlockNode('sharp_thorns', new Set())).toBe(true);
    expect(canUnlockNode('spore_cloud', new Set())).toBe(true);
    expect(canUnlockNode('compost', new Set())).toBe(true);
  });

  it('blocks second node if first is not unlocked', () => {
    expect(canUnlockNode('bigger_hive', new Set())).toBe(false);
  });

  it('allows second node when first is unlocked', () => {
    expect(canUnlockNode('bigger_hive', new Set(['sharp_thorns']))).toBe(true);
  });
});

describe('TECH_NODES', () => {
  it('has 18 nodes total', () => {
    expect(TECH_NODES).toHaveLength(18);
  });

  it('has 6 nodes per branch', () => {
    const roots = TECH_NODES.filter(n => n.branch === 'roots');
    const species = TECH_NODES.filter(n => n.branch === 'species');
    const garden = TECH_NODES.filter(n => n.branch === 'garden');
    expect(roots).toHaveLength(6);
    expect(species).toHaveLength(6);
    expect(garden).toHaveLength(6);
  });
});
