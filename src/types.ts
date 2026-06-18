export type TowerType =
  | 'thorn_bush' | 'beehive' | 'sunflower' | 'sprinkler' | 'cactus'
  | 'mushroom' | 'venus_flytrap' | 'rose' | 'watering_can' | 'pumpkin' | 'oak_tree';

export type EnemyType = 'caterpillar' | 'ladybug' | 'snail' | 'boss_snail';

export type GamePhase = 'prep' | 'wave_countdown' | 'wave' | 'run_end';

export interface GridPos {
  col: number; // 0–19
  row: number; // 0–11
}

export interface Enemy {
  id: string;
  type: EnemyType;
  progress: number;   // 0 to pathTiles.length-1 (position along path)
  hp: number;
  maxHp: number;
  speed: number;      // path-tiles per second
  slowTimer: number;  // seconds of slow remaining
  activeSlowFactor: number; // multiplier applied to speed while slowed (e.g. 0.5 = half speed)
  poisonTimer: number;
  poisonDps: number;
  stunTimer: number;
  reverseTimer: number;
  exited?: boolean;   // true if enemy reached the path exit (not killed — no gold reward)
}

export interface PlacedTower {
  id: string;
  type: TowerType;
  col: number;
  row: number;
  cooldownTimer: number;    // seconds until next attack (counts down)
  incomeTimer: number;      // sunflower only: seconds until next gold tick
  hp: number;               // pumpkin only: when 0 it explodes
}

export interface EnemySpawn {
  type: EnemyType;
  delaySeconds: number; // time from wave start to spawn
}

export interface GameState {
  phase: GamePhase;
  wave: number;
  gold: number;
  lives: number;
  enemiesKilledThisRun: number;
  seedsThisRun: number;
  enemies: Enemy[];
  towers: PlacedTower[];
  pendingSpawns: EnemySpawn[];
  spawnTimer: number;
  prepTimer: number;
  waveCountdownTimer: number;
  selectedTowerType: TowerType | null;
  selectedTowerId: string | null;
}

export interface TowerStats {
  emoji: string;
  label: string;
  cost: number;
  damage: number;
  range: number;           // in grid tiles (radius)
  cooldown: number;        // seconds between attacks
  aoe: boolean;
  aoeRadius: number;       // grid tiles, 0 if not AoE
  incomeAmount: number;    // gold per tick (sunflower)
  incomeInterval: number;  // seconds per tick (sunflower)
  slowFactor: number;      // 0 = no slow, 0.5 = half speed
  slowDuration: number;    // seconds
  poisonDps: number;       // poison damage per second
  poisonDuration: number;  // seconds
  stunDuration: number;    // seconds
  reverseDuration: number; // seconds
}

export interface EnemyStats {
  emoji: string;
  label: string;
  hp: number;
  speed: number;       // path-tiles per second
  goldReward: number;
}

export interface GameConfig {
  startingGold: number;
  startingLives: number;
  prepTime: number;
  extraGold: number;
  extraLives: number;
  costMultiplier: number;
  globalDamageMultiplier: number;
  globalSpeedMultiplier: number;
  thornDamageMultiplier: number;
  hiveRangeMultiplier: number;
  sunflowerIncomeMultiplier: number;
  sprinklerDurationMultiplier: number;
  cactusCritChance: number;
  startingFreeThorn: boolean;
  unlockedTowers: TowerType[];
}

export interface TechNode {
  id: string;
  branch: 'roots' | 'species' | 'garden';
  position: number; // 1–6
  name: string;
  description: string;
  cost: number;
}

export interface TechTreeState {
  seeds: number;
  unlocked: Set<string>;
}
