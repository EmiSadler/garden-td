import type { TechNode, GameConfig, TowerType, PrestigeNode, PrestigeConfig } from './types';

const BASE_UNLOCKED_TOWERS: TowerType[] = [
  'thorn_bush', 'beehive', 'sunflower', 'sprinkler', 'cactus',
];

export const DEFAULT_PRESTIGE_CONFIG: PrestigeConfig = {
  seedSavingsRate: 0,
  permanentExtraLives: 0,
  permanentCostMultiplier: 1.0,
  permanentDamageMultiplier: 1.0,
  bossDropsPetals: 1,
  permanentPrepTimeBonus: 0,
  techNodeCostMultiplier: 1.0,
  startingFreeTowers: [],
  unlockedMapIds: [1],
  slowMotionUnlocked: false,
};

export const TECH_NODES: TechNode[] = [
  // Roots branch — tower upgrades
  { id: 'sharp_thorns',   branch: 'roots',   position: 1, name: 'Sharp Thorns',   description: 'Thorn Bush +25% damage',             cost: 5  },
  { id: 'bigger_hive',    branch: 'roots',   position: 2, name: 'Bigger Hive',    description: 'Beehive +30% range',                 cost: 8  },
  { id: 'golden_petals',  branch: 'roots',   position: 3, name: 'Golden Petals',  description: 'Sunflower +50% gold income',          cost: 8  },
  { id: 'longer_soak',    branch: 'roots',   position: 4, name: 'Longer Soak',    description: 'Sprinkler slow duration +50%',        cost: 6  },
  { id: 'spine_shield',   branch: 'roots',   position: 5, name: 'Spine Shield',   description: 'Cactus gains 20% crit chance',        cost: 10 },
  { id: 'root_network',   branch: 'roots',   position: 6, name: 'Root Network',   description: 'All towers +10% damage',              cost: 20 },
  // Species branch — new towers
  { id: 'spore_cloud',    branch: 'species', position: 1, name: 'Spore Cloud',    description: 'Unlock Mushroom (poison DOT)',        cost: 15 },
  { id: 'snap',           branch: 'species', position: 2, name: 'Snap',           description: 'Unlock Venus Flytrap (stun)',         cost: 15 },
  { id: 'hypnopetal',     branch: 'species', position: 3, name: 'Hypnopetal',     description: 'Unlock Rose (reverse direction)',     cost: 20 },
  { id: 'chain_drip',     branch: 'species', position: 4, name: 'Chain Drip',     description: 'Unlock Watering Can (chain slow)',    cost: 20 },
  { id: 'last_bloom',     branch: 'species', position: 5, name: 'Last Bloom',     description: 'Unlock Pumpkin (death AoE)',          cost: 25 },
  { id: 'ancient_growth', branch: 'species', position: 6, name: 'Ancient Growth', description: 'Unlock Oak Tree (massive AoE)',       cost: 30 },
  // Garden branch — run-start bonuses
  { id: 'compost',        branch: 'garden',  position: 1, name: 'Compost',        description: 'Start each run with +30 gold',        cost: 5  },
  { id: 'tough_roots',    branch: 'garden',  position: 2, name: 'Tough Roots',    description: 'Start with 1 extra life',             cost: 10 },
  { id: 'early_bloom',    branch: 'garden',  position: 3, name: 'Early Bloom',    description: 'Prep phase extended to 20s',          cost: 8  },
  { id: 'fertile_soil',   branch: 'garden',  position: 4, name: 'Fertile Soil',   description: 'All towers cost 10% less',            cost: 12 },
  { id: 'morning_dew',    branch: 'garden',  position: 5, name: 'Morning Dew',    description: 'Global +15% attack speed',            cost: 15 },
  { id: 'full_garden',    branch: 'garden',  position: 6, name: 'Full Garden',    description: 'Start with 1 free Thorn Bush placed', cost: 20 },
];

export const PRESTIGE_NODES: PrestigeNode[] = [
  // Maps cluster
  { id: 'unlock_map2',      cluster: 'maps',    name: 'New Lands',        description: 'Unlock Map 2 — The Gauntlet',          cost: 3,  requires: []                                       },
  { id: 'unlock_map3',      cluster: 'maps',    name: 'The Crossroads',   description: 'Unlock Map 3 — The Crossroads',        cost: 6,  requires: ['unlock_map2']                          },
  { id: 'unlock_map4',      cluster: 'maps',    name: 'The Labyrinth',    description: 'Unlock Map 4 — The Labyrinth',         cost: 10, requires: ['unlock_map3']                          },
  // Seed carry-over cluster
  { id: 'seed_savings_1',   cluster: 'seeds',   name: 'Seed Savings I',   description: 'Keep 15% of seeds on prestige',        cost: 2,  requires: []                                       },
  { id: 'seed_savings_2',   cluster: 'seeds',   name: 'Seed Savings II',  description: 'Keep 30% of seeds on prestige',        cost: 4,  requires: ['seed_savings_1']                       },
  { id: 'seed_savings_3',   cluster: 'seeds',   name: 'Seed Savings III', description: 'Keep 50% of seeds on prestige',        cost: 7,  requires: ['seed_savings_2']                       },
  // Permanent bonuses cluster
  { id: 'iron_roots',       cluster: 'bonuses', name: 'Iron Roots',       description: '+1 permanent starting life',            cost: 3,  requires: []                                       },
  { id: 'ancient_soil',     cluster: 'bonuses', name: 'Ancient Soil',     description: 'Tower costs 5% cheaper permanently',   cost: 3,  requires: []                                       },
  { id: 'veteran_gardener', cluster: 'bonuses', name: 'Veteran Gardener', description: 'Global +10% permanent damage',         cost: 4,  requires: ['ancient_soil']                         },
  { id: 'boss_bounty',      cluster: 'bonuses', name: 'Boss Bounty',      description: 'Bosses drop 2 petals instead of 1',    cost: 5,  requires: ['unlock_map2']                          },
  { id: 'quick_study',      cluster: 'bonuses', name: 'Quick Study',      description: 'Tech tree nodes cost 10% fewer seeds', cost: 4,  requires: ['seed_savings_1']                       },
  { id: 'master_bloomer',   cluster: 'bonuses', name: 'Master Bloomer',   description: '+10s prep time permanently',            cost: 2,  requires: []                                       },
  { id: 'slow_motion',      cluster: 'bonuses', name: 'Slow Motion',      description: 'Unlock ⅓× speed control in the HUD',   cost: 3,  requires: []                                       },
  // Legacy towers cluster
  { id: 'legacy_beehive',   cluster: 'legacy',  name: 'Legacy Beehive',   description: 'Start each run with a free 🍯',       cost: 4,  requires: ['ancient_soil']                         },
  { id: 'legacy_sprinkler', cluster: 'legacy',  name: 'Legacy Sprinkler', description: 'Start each run with a free 💧',       cost: 4,  requires: ['iron_roots']                           },
  { id: 'legacy_cactus',    cluster: 'legacy',  name: 'Legacy Cactus',    description: 'Start each run with a free 🌵',       cost: 6,  requires: [], requiresAny: ['legacy_beehive', 'legacy_sprinkler'] },
  { id: 'grand_legacy',     cluster: 'legacy',  name: 'Grand Legacy',     description: 'Start with an additional free 🌿',    cost: 8,  requires: ['legacy_cactus']                        },
];

export function computePrestigeConfig(unlocked: Set<string>): PrestigeConfig {
  const config: PrestigeConfig = {
    ...DEFAULT_PRESTIGE_CONFIG,
    startingFreeTowers: [],
    unlockedMapIds: [1],
  };

  if (unlocked.has('seed_savings_3'))       config.seedSavingsRate = 0.50;
  else if (unlocked.has('seed_savings_2'))  config.seedSavingsRate = 0.30;
  else if (unlocked.has('seed_savings_1'))  config.seedSavingsRate = 0.15;

  if (unlocked.has('iron_roots'))           config.permanentExtraLives += 1;
  if (unlocked.has('ancient_soil'))         config.permanentCostMultiplier *= 0.95;
  if (unlocked.has('veteran_gardener'))     config.permanentDamageMultiplier *= 1.1;
  if (unlocked.has('boss_bounty'))          config.bossDropsPetals = 2;
  if (unlocked.has('master_bloomer'))       config.permanentPrepTimeBonus += 10;
  if (unlocked.has('quick_study'))          config.techNodeCostMultiplier = 0.9;

  if (unlocked.has('legacy_beehive'))       config.startingFreeTowers.push('beehive');
  if (unlocked.has('legacy_sprinkler'))     config.startingFreeTowers.push('sprinkler');
  if (unlocked.has('legacy_cactus'))        config.startingFreeTowers.push('cactus');
  if (unlocked.has('grand_legacy'))         config.startingFreeTowers.push('thorn_bush');

  if (unlocked.has('unlock_map2')) config.unlockedMapIds.push(2);
  if (unlocked.has('unlock_map3')) config.unlockedMapIds.push(3);
  if (unlocked.has('unlock_map4')) config.unlockedMapIds.push(4);

  if (unlocked.has('slow_motion')) config.slowMotionUnlocked = true;

  return config;
}

export function canUnlockPrestigeNode(nodeId: string, unlocked: Set<string>, petals: number): boolean {
  const node = PRESTIGE_NODES.find(n => n.id === nodeId);
  if (!node || unlocked.has(nodeId) || petals < node.cost) return false;
  const andSatisfied = node.requires.every(r => unlocked.has(r));
  const orSatisfied = !node.requiresAny || node.requiresAny.some(r => unlocked.has(r));
  return andSatisfied && orSatisfied;
}

export function computeGameConfig(
  techUnlocked: Set<string>,
  prestigeConfig: PrestigeConfig = DEFAULT_PRESTIGE_CONFIG,
): GameConfig {
  const config: GameConfig = {
    startingGold: 200,
    startingLives: 3,
    prepTime: 10,
    extraGold: 0,
    extraLives: 0,
    costMultiplier: 1.0,
    globalDamageMultiplier: 1.0,
    globalSpeedMultiplier: 1.0,
    thornDamageMultiplier: 1.0,
    hiveRangeMultiplier: 1.0,
    sunflowerIncomeMultiplier: 1.0,
    sprinklerDurationMultiplier: 1.0,
    cactusCritChance: 0,
    startingFreeTowers: [],
    bossDropsPetals: prestigeConfig.bossDropsPetals,
    techNodeCostMultiplier: prestigeConfig.techNodeCostMultiplier,
    unlockedTowers: [...BASE_UNLOCKED_TOWERS],
    unlockedMapIds: [...prestigeConfig.unlockedMapIds],
  };

  // Prestige permanent bonuses
  config.extraLives             += prestigeConfig.permanentExtraLives;
  config.costMultiplier         *= prestigeConfig.permanentCostMultiplier;
  config.globalDamageMultiplier *= prestigeConfig.permanentDamageMultiplier;
  config.prepTime               += prestigeConfig.permanentPrepTimeBonus;
  config.startingFreeTowers.push(...prestigeConfig.startingFreeTowers);

  // Tech tree bonuses
  if (techUnlocked.has('sharp_thorns'))   config.thornDamageMultiplier *= 1.25;
  if (techUnlocked.has('bigger_hive'))    config.hiveRangeMultiplier *= 1.3;
  if (techUnlocked.has('golden_petals'))  config.sunflowerIncomeMultiplier *= 1.5;
  if (techUnlocked.has('longer_soak'))    config.sprinklerDurationMultiplier *= 1.5;
  if (techUnlocked.has('spine_shield'))   config.cactusCritChance = 0.2;
  if (techUnlocked.has('root_network'))   config.globalDamageMultiplier *= 1.1;
  if (techUnlocked.has('spore_cloud'))    config.unlockedTowers.push('mushroom');
  if (techUnlocked.has('snap'))           config.unlockedTowers.push('venus_flytrap');
  if (techUnlocked.has('hypnopetal'))     config.unlockedTowers.push('rose');
  if (techUnlocked.has('chain_drip'))     config.unlockedTowers.push('watering_can');
  if (techUnlocked.has('last_bloom'))     config.unlockedTowers.push('pumpkin');
  if (techUnlocked.has('ancient_growth')) config.unlockedTowers.push('oak_tree');
  if (techUnlocked.has('compost'))        config.extraGold += 30;
  if (techUnlocked.has('tough_roots'))    config.extraLives += 1;
  if (techUnlocked.has('early_bloom'))    config.prepTime = Math.max(config.prepTime, 20);
  if (techUnlocked.has('fertile_soil'))   config.costMultiplier *= 0.9;
  if (techUnlocked.has('morning_dew'))    config.globalSpeedMultiplier *= 1.15;
  if (techUnlocked.has('full_garden'))    config.startingFreeTowers.push('thorn_bush');

  return config;
}

export function canUnlockNode(nodeId: string, unlocked: Set<string>): boolean {
  const node = TECH_NODES.find(n => n.id === nodeId);
  if (!node) return false;
  if (node.position === 1) return true;
  const prev = TECH_NODES.find(n => n.branch === node.branch && n.position === node.position - 1);
  return prev ? unlocked.has(prev.id) : false;
}
