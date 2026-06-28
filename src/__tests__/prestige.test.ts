import { describe, it, expect } from 'vitest';
import { computePrestigeConfig, canUnlockPrestigeNode, computeGameConfig, PRESTIGE_NODES } from '../gameConfig';

describe('PRESTIGE_NODES', () => {
  it('has 17 nodes', () => {
    expect(PRESTIGE_NODES).toHaveLength(17);
  });

  it('includes unlock_map2 with no prerequisites', () => {
    const node = PRESTIGE_NODES.find(n => n.id === 'unlock_map2')!;
    expect(node.cost).toBe(3);
    expect(node.requires).toEqual([]);
    expect(node.requiresAny).toBeUndefined();
  });

  it('legacy_cactus has requiresAny with two options', () => {
    const node = PRESTIGE_NODES.find(n => n.id === 'legacy_cactus')!;
    expect(node.requiresAny).toEqual(['legacy_beehive', 'legacy_sprinkler']);
  });
});

describe('computePrestigeConfig', () => {
  it('returns default values with empty unlock set', () => {
    const c = computePrestigeConfig(new Set());
    expect(c.seedSavingsRate).toBe(0);
    expect(c.permanentExtraLives).toBe(0);
    expect(c.permanentCostMultiplier).toBeCloseTo(1.0);
    expect(c.permanentDamageMultiplier).toBeCloseTo(1.0);
    expect(c.bossDropsPetals).toBe(1);
    expect(c.permanentPrepTimeBonus).toBe(0);
    expect(c.techNodeCostMultiplier).toBeCloseTo(1.0);
    expect(c.startingFreeTowers).toEqual([]);
    expect(c.unlockedMapIds).toEqual([1]);
  });

  it('seed_savings_1 sets rate to 0.15', () => {
    const c = computePrestigeConfig(new Set(['seed_savings_1']));
    expect(c.seedSavingsRate).toBeCloseTo(0.15);
  });

  it('seed_savings_3 takes priority over lower tiers', () => {
    const c = computePrestigeConfig(new Set(['seed_savings_1', 'seed_savings_2', 'seed_savings_3']));
    expect(c.seedSavingsRate).toBeCloseTo(0.50);
  });

  it('iron_roots adds 1 permanent extra life', () => {
    const c = computePrestigeConfig(new Set(['iron_roots']));
    expect(c.permanentExtraLives).toBe(1);
  });

  it('ancient_soil sets cost multiplier to 0.95', () => {
    const c = computePrestigeConfig(new Set(['ancient_soil']));
    expect(c.permanentCostMultiplier).toBeCloseTo(0.95);
  });

  it('veteran_gardener sets damage multiplier to 1.1', () => {
    const c = computePrestigeConfig(new Set(['veteran_gardener']));
    expect(c.permanentDamageMultiplier).toBeCloseTo(1.1);
  });

  it('boss_bounty sets bossDropsPetals to 2', () => {
    const c = computePrestigeConfig(new Set(['boss_bounty']));
    expect(c.bossDropsPetals).toBe(2);
  });

  it('master_bloomer adds 10 prep time bonus', () => {
    const c = computePrestigeConfig(new Set(['master_bloomer']));
    expect(c.permanentPrepTimeBonus).toBe(10);
  });

  it('quick_study sets techNodeCostMultiplier to 0.9', () => {
    const c = computePrestigeConfig(new Set(['quick_study']));
    expect(c.techNodeCostMultiplier).toBeCloseTo(0.9);
  });

  it('legacy nodes populate startingFreeTowers in order', () => {
    const c = computePrestigeConfig(new Set(['legacy_beehive', 'legacy_sprinkler', 'legacy_cactus', 'grand_legacy']));
    expect(c.startingFreeTowers).toEqual(['beehive', 'sprinkler', 'cactus', 'thorn_bush']);
  });

  it('unlock_map2 adds map 2 to unlockedMapIds', () => {
    const c = computePrestigeConfig(new Set(['unlock_map2']));
    expect(c.unlockedMapIds).toContain(1);
    expect(c.unlockedMapIds).toContain(2);
  });

  it('unlock_map4 adds maps 2, 3, 4', () => {
    const c = computePrestigeConfig(new Set(['unlock_map2', 'unlock_map3', 'unlock_map4']));
    expect(c.unlockedMapIds).toEqual([1, 2, 3, 4]);
  });
});

describe('canUnlockPrestigeNode', () => {
  it('allows a free node (no requires) when petals sufficient', () => {
    expect(canUnlockPrestigeNode('unlock_map2', new Set(), 3)).toBe(true);
  });

  it('blocks when petals insufficient', () => {
    expect(canUnlockPrestigeNode('unlock_map2', new Set(), 2)).toBe(false);
  });

  it('blocks when already unlocked', () => {
    expect(canUnlockPrestigeNode('unlock_map2', new Set(['unlock_map2']), 10)).toBe(false);
  });

  it('blocks unlock_map3 when unlock_map2 not unlocked', () => {
    expect(canUnlockPrestigeNode('unlock_map3', new Set(), 6)).toBe(false);
  });

  it('allows unlock_map3 when unlock_map2 is unlocked', () => {
    expect(canUnlockPrestigeNode('unlock_map3', new Set(['unlock_map2']), 6)).toBe(true);
  });

  it('legacy_cactus unlocks when legacy_beehive is unlocked (OR gate)', () => {
    expect(canUnlockPrestigeNode('legacy_cactus', new Set(['legacy_beehive']), 6)).toBe(true);
  });

  it('legacy_cactus unlocks when legacy_sprinkler is unlocked (OR gate)', () => {
    expect(canUnlockPrestigeNode('legacy_cactus', new Set(['legacy_sprinkler']), 6)).toBe(true);
  });

  it('legacy_cactus blocked when neither legacy_beehive nor legacy_sprinkler unlocked', () => {
    expect(canUnlockPrestigeNode('legacy_cactus', new Set(), 6)).toBe(false);
  });
});

describe('prestige kept seeds calculation via computePrestigeConfig', () => {
  it('keeps 0 seeds with no seed savings', () => {
    const c = computePrestigeConfig(new Set());
    expect(Math.floor(100 * c.seedSavingsRate)).toBe(0);
  });

  it('keeps 15 of 100 seeds with seed_savings_1', () => {
    const c = computePrestigeConfig(new Set(['seed_savings_1']));
    expect(Math.floor(100 * c.seedSavingsRate)).toBe(15);
  });

  it('keeps 49 of 99 seeds with seed_savings_3 (floor applied)', () => {
    const c = computePrestigeConfig(new Set(['seed_savings_1', 'seed_savings_2', 'seed_savings_3']));
    expect(Math.floor(99 * c.seedSavingsRate)).toBe(49);
  });
});

describe('computeGameConfig — prestige and tech interaction', () => {
  it('early_bloom does not overwrite master_bloomer bonus (both give 20s)', () => {
    const prestige = computePrestigeConfig(new Set(['master_bloomer']));
    const config = computeGameConfig(new Set(['early_bloom']), prestige);
    expect(config.prepTime).toBe(20);
  });

  it('early_bloom alone gives prepTime 20', () => {
    const config = computeGameConfig(new Set(['early_bloom']));
    expect(config.prepTime).toBe(20);
  });
});
