export type TowerType =
  | 'thorn_bush' | 'beehive' | 'sunflower' | 'sprinkler' | 'cactus'
  | 'mushroom' | 'venus_flytrap' | 'rose' | 'watering_can' | 'pumpkin' | 'oak_tree';

export type EnemyType = 'caterpillar' | 'ladybug' | 'snail' | 'boss_snail';

export type GamePhase = 'prep' | 'wave_countdown' | 'wave' | 'run_end';

export interface GridPos {
  col: number; // 0–19
  row: number; // 0–11
}

// A linear array of tiles forming one path segment
export interface PathSegment {
  id: string;
  tiles: GridPos[];
  nextSegmentIds: string[]; // empty array = this segment leads to the exit
}

export interface MapDef {
  id: number;
  name: string;
  difficulty: string;        // display label e.g. "Easiest", "Hard"
  seedMultiplier: number;
  petalMultiplier: number;
  segments: PathSegment[];
  entrySegmentId: string;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  segmentId: string;         // which segment the enemy is currently on
  segmentProgress: number;   // 0 to segment.tiles.length-1 within that segment
  totalProgress: number;     // total tiles traversed across all segments (used for targeting priority)
  hp: number;
  maxHp: number;
  speed: number;             // path-tiles per second
  slowTimer: number;
  activeSlowFactor: number;
  poisonTimer: number;
  poisonDps: number;
  stunTimer: number;
  reverseTimer: number;
  reverseImmunityTimer: number;
  exited?: boolean;
}

export interface PlacedTower {
  id: string;
  type: TowerType;
  col: number;
  row: number;
  cooldownTimer: number;
  incomeTimer: number;
  hp: number;
  fireCount: number;
  lastFireWasCrit: boolean;
}

export interface EnemySpawn {
  type: EnemyType;
  delaySeconds: number;
}

export interface GameState {
  phase: GamePhase;
  mapId: number;             // which map this run is on
  wave: number;
  gold: number;
  lives: number;
  enemiesKilledThisRun: number;
  seedsThisRun: number;
  petalsThisRun: number;     // prestige petals earned this run
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
  range: number;
  cooldown: number;
  aoe: boolean;
  aoeRadius: number;
  incomeAmount: number;
  incomeInterval: number;
  slowFactor: number;
  slowDuration: number;
  poisonDps: number;
  poisonDuration: number;
  stunDuration: number;
  reverseDuration: number;
}

export interface EnemyStats {
  emoji: string;
  label: string;
  hp: number;
  speed: number;
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
  startingFreeTowers: TowerType[];
  bossDropsPetals: number;
  techNodeCostMultiplier: number;
  unlockedTowers: TowerType[];
  unlockedMapIds: number[];
}

export interface TechNode {
  id: string;
  branch: 'roots' | 'species' | 'garden';
  position: number;
  name: string;
  description: string;
  cost: number;
}

export interface TechTreeState {
  seeds: number;
  unlocked: Set<string>;
}

export interface PrestigeNode {
  id: string;
  cluster: 'maps' | 'seeds' | 'bonuses' | 'legacy';
  name: string;
  description: string;
  cost: number;
  requires: string[];
  requiresAny?: string[];
}

export interface PrestigeTreeState {
  petals: number;
  unlocked: Set<string>;
}

export interface PrestigeConfig {
  seedSavingsRate: number;
  permanentExtraLives: number;
  permanentCostMultiplier: number;
  permanentDamageMultiplier: number;
  bossDropsPetals: number;
  permanentPrepTimeBonus: number;
  techNodeCostMultiplier: number;
  startingFreeTowers: TowerType[];
  unlockedMapIds: number[];
  slowMotionUnlocked: boolean;
}
