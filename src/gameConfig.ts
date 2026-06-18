import type { TechNode, GameConfig, TowerType } from './types';

const BASE_UNLOCKED_TOWERS: TowerType[] = [
  'thorn_bush', 'beehive', 'sunflower', 'sprinkler', 'cactus',
];

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

export function computeGameConfig(unlocked: Set<string>): GameConfig {
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
    startingFreeThorn: false,
    unlockedTowers: [...BASE_UNLOCKED_TOWERS],
  };

  if (unlocked.has('sharp_thorns'))   config.thornDamageMultiplier *= 1.25;
  if (unlocked.has('bigger_hive'))    config.hiveRangeMultiplier *= 1.3;
  if (unlocked.has('golden_petals'))  config.sunflowerIncomeMultiplier *= 1.5;
  if (unlocked.has('longer_soak'))    config.sprinklerDurationMultiplier *= 1.5;
  if (unlocked.has('spine_shield'))   config.cactusCritChance = 0.2;
  if (unlocked.has('root_network'))   config.globalDamageMultiplier *= 1.1;
  if (unlocked.has('spore_cloud'))    config.unlockedTowers.push('mushroom');
  if (unlocked.has('snap'))           config.unlockedTowers.push('venus_flytrap');
  if (unlocked.has('hypnopetal'))     config.unlockedTowers.push('rose');
  if (unlocked.has('chain_drip'))     config.unlockedTowers.push('watering_can');
  if (unlocked.has('last_bloom'))     config.unlockedTowers.push('pumpkin');
  if (unlocked.has('ancient_growth')) config.unlockedTowers.push('oak_tree');
  if (unlocked.has('compost'))        config.extraGold += 30;
  if (unlocked.has('tough_roots'))    config.extraLives += 1;
  if (unlocked.has('early_bloom'))    config.prepTime = 20;
  if (unlocked.has('fertile_soil'))   config.costMultiplier *= 0.9;
  if (unlocked.has('morning_dew'))    config.globalSpeedMultiplier *= 1.15;
  if (unlocked.has('full_garden'))    config.startingFreeThorn = true;

  return config;
}

export function canUnlockNode(nodeId: string, unlocked: Set<string>): boolean {
  const node = TECH_NODES.find(n => n.id === nodeId);
  if (!node) return false;
  if (node.position === 1) return true;
  const prev = TECH_NODES.find(n => n.branch === node.branch && n.position === node.position - 1);
  return prev ? unlocked.has(prev.id) : false;
}
