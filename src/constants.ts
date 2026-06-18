import type { TowerStats, EnemyStats, TowerType, EnemyType } from './types';

export const GRID_COLS = 20;
export const GRID_ROWS = 12;
export const TILE_SIZE = 48; // px

export const WAVE_COUNTDOWN = 3;    // seconds between waves
export const SPAWN_INTERVAL = 0.8;  // seconds between enemy spawns within a wave
export const SELL_REFUND = 0.5;     // fraction of cost refunded on sell

export const BASE_TOWER_STATS: Record<TowerType, TowerStats> = {
  thorn_bush: {
    emoji: '🌿', label: 'Thorn Bush',
    cost: 50, damage: 10, range: 2, cooldown: 0.5, aoe: false, aoeRadius: 0,
    incomeAmount: 0, incomeInterval: 0, slowFactor: 0, slowDuration: 0,
    poisonDps: 0, poisonDuration: 0, stunDuration: 0, reverseDuration: 0,
  },
  beehive: {
    emoji: '🍯', label: 'Beehive',
    cost: 100, damage: 8, range: 3, cooldown: 1.0, aoe: true, aoeRadius: 1.5,
    incomeAmount: 0, incomeInterval: 0, slowFactor: 0, slowDuration: 0,
    poisonDps: 0, poisonDuration: 0, stunDuration: 0, reverseDuration: 0,
  },
  sunflower: {
    emoji: '🌻', label: 'Sunflower',
    cost: 75, damage: 0, range: 0, cooldown: 0, aoe: false, aoeRadius: 0,
    incomeAmount: 10, incomeInterval: 5, slowFactor: 0, slowDuration: 0,
    poisonDps: 0, poisonDuration: 0, stunDuration: 0, reverseDuration: 0,
  },
  sprinkler: {
    emoji: '💧', label: 'Sprinkler',
    cost: 80, damage: 0, range: 3, cooldown: 0.5, aoe: true, aoeRadius: 3,
    incomeAmount: 0, incomeInterval: 0, slowFactor: 0.5, slowDuration: 2,
    poisonDps: 0, poisonDuration: 0, stunDuration: 0, reverseDuration: 0,
  },
  cactus: {
    emoji: '🌵', label: 'Cactus',
    cost: 125, damage: 30, range: 4, cooldown: 2.0, aoe: false, aoeRadius: 0,
    incomeAmount: 0, incomeInterval: 0, slowFactor: 0, slowDuration: 0,
    poisonDps: 0, poisonDuration: 0, stunDuration: 0, reverseDuration: 0,
  },
  mushroom: {
    emoji: '🍄', label: 'Mushroom',
    cost: 90, damage: 5, range: 2.5, cooldown: 1.5, aoe: false, aoeRadius: 0,
    incomeAmount: 0, incomeInterval: 0, slowFactor: 0, slowDuration: 0,
    poisonDps: 5, poisonDuration: 3, stunDuration: 0, reverseDuration: 0,
  },
  venus_flytrap: {
    emoji: '🪤', label: 'Venus Flytrap',
    cost: 110, damage: 15, range: 1.5, cooldown: 3.0, aoe: false, aoeRadius: 0,
    incomeAmount: 0, incomeInterval: 0, slowFactor: 0, slowDuration: 0,
    poisonDps: 0, poisonDuration: 0, stunDuration: 2, reverseDuration: 0,
  },
  rose: {
    emoji: '🌹', label: 'Rose',
    cost: 120, damage: 0, range: 3, cooldown: 5.0, aoe: false, aoeRadius: 0,
    incomeAmount: 0, incomeInterval: 0, slowFactor: 0, slowDuration: 0,
    poisonDps: 0, poisonDuration: 0, stunDuration: 0, reverseDuration: 3,
  },
  watering_can: {
    emoji: '🪣', label: 'Watering Can',
    cost: 100, damage: 0, range: 3.5, cooldown: 1.0, aoe: false, aoeRadius: 0,
    incomeAmount: 0, incomeInterval: 0, slowFactor: 0.4, slowDuration: 2.5,
    poisonDps: 0, poisonDuration: 0, stunDuration: 0, reverseDuration: 0,
  },
  pumpkin: {
    emoji: '🎃', label: 'Pumpkin',
    cost: 130, damage: 5, range: 2, cooldown: 1.0, aoe: false, aoeRadius: 0,
    incomeAmount: 0, incomeInterval: 0, slowFactor: 0, slowDuration: 0,
    poisonDps: 0, poisonDuration: 0, stunDuration: 0, reverseDuration: 0,
  },
  oak_tree: {
    emoji: '🌳', label: 'Oak Tree',
    cost: 200, damage: 20, range: 4, cooldown: 4.0, aoe: true, aoeRadius: 4,
    incomeAmount: 0, incomeInterval: 0, slowFactor: 0, slowDuration: 0,
    poisonDps: 0, poisonDuration: 0, stunDuration: 0, reverseDuration: 0,
  },
};

export const BASE_ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  caterpillar: { emoji: '🐛', label: 'Caterpillar', hp: 45,   speed: 2.0, goldReward: 1  },
  ladybug:     { emoji: '🐞', label: 'Ladybug',     hp: 22,   speed: 4.0, goldReward: 1  },
  snail:       { emoji: '🐌', label: 'Snail',       hp: 150,  speed: 0.8, goldReward: 3  },
  boss_snail:  { emoji: '🐌', label: 'Boss Snail',  hp: 1500, speed: 0.5, goldReward: 15 },
};
