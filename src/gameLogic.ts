import { v4 as uuidv4 } from 'uuid';
import type { Enemy, EnemyType, PlacedTower, TowerType, GameState, GameConfig, GridPos, MapDef } from './types';
import { BASE_ENEMY_STATS, BASE_TOWER_STATS, WAVE_COUNTDOWN } from './constants';
import { buildWave, calculateSeeds } from './waveBuilder';

// ─── Factories ───────────────────────────────────────────────────────────────

export function makeEnemy(type: EnemyType, entrySegmentId: string, hpMultiplier = 1, speedMultiplier = 1): Enemy {
  const stats = BASE_ENEMY_STATS[type];
  const hp = Math.round(stats.hp * hpMultiplier);
  return {
    id: uuidv4(),
    type,
    segmentId: entrySegmentId,
    segmentProgress: 0,
    totalProgress: 0,
    hp,
    maxHp: hp,
    speed: stats.speed * speedMultiplier,
    slowTimer: 0,
    poisonTimer: 0,
    poisonDps: 0,
    stunTimer: 0,
    reverseTimer: 0,
    reverseImmunityTimer: 0,
    activeSlowFactor: 0.5,
  };
}

export function makePlacedTower(type: TowerType, col: number, row: number): PlacedTower {
  return {
    id: uuidv4(),
    type,
    col,
    row,
    cooldownTimer: 0,
    incomeTimer: BASE_TOWER_STATS[type].incomeInterval,
    hp: Infinity,
  };
}

// ─── Targeting ───────────────────────────────────────────────────────────────

export function getEnemyGridPos(enemy: Enemy, map: MapDef): GridPos {
  const segment = map.segments.find(s => s.id === enemy.segmentId);
  if (!segment) return { col: 0, row: 0 };
  const idx = Math.max(0, Math.min(Math.floor(enemy.segmentProgress), segment.tiles.length - 1));
  return segment.tiles[idx];
}

export function findTarget(
  tower: PlacedTower,
  enemies: Enemy[],
  range: number,
  map: MapDef,
): Enemy | null {
  let best: Enemy | null = null;
  let bestTotal = -1;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.stunTimer > 0) continue;
    const ePos = getEnemyGridPos(enemy, map);
    const dist = Math.sqrt((ePos.col - tower.col) ** 2 + (ePos.row - tower.row) ** 2);
    if (dist <= range && enemy.totalProgress > bestTotal) {
      bestTotal = enemy.totalProgress;
      best = enemy;
    }
  }
  return best;
}

export function findTargetsInRadius(
  col: number,
  row: number,
  radius: number,
  enemies: Enemy[],
  map: MapDef,
): Enemy[] {
  return enemies.filter(e => {
    if (e.hp <= 0) return false;
    const ePos = getEnemyGridPos(e, map);
    const dist = Math.sqrt((ePos.col - col) ** 2 + (ePos.row - row) ** 2);
    return dist <= radius;
  });
}

// ─── Damage ──────────────────────────────────────────────────────────────────

export function applyDamageToEnemy(enemy: Enemy, damage: number): Enemy {
  return { ...enemy, hp: Math.max(0, enemy.hp - damage) };
}

// ─── Spawn logic ─────────────────────────────────────────────────────────────

function spawnDueEnemies(state: GameState, dt: number, map: MapDef): GameState {
  if (state.pendingSpawns.length === 0) return state;

  const newSpawnTimer = state.spawnTimer + dt;
  const pending = [...state.pendingSpawns];
  const newEnemies: Enemy[] = [];
  const hpMultiplier = Math.pow(1.15, state.wave - 1);
  const speedMultiplier = Math.pow(1.02, state.wave - 1);

  let i = 0;
  while (i < pending.length && pending[i].delaySeconds <= newSpawnTimer) {
    newEnemies.push(makeEnemy(pending[i].type, map.entrySegmentId, hpMultiplier, speedMultiplier));
    i++;
  }

  return {
    ...state,
    spawnTimer: newSpawnTimer,
    pendingSpawns: pending.slice(i),
    enemies: [...state.enemies, ...newEnemies],
  };
}

// ─── Enemy movement ───────────────────────────────────────────────────────────

function tickEnemyMovement(state: GameState, dt: number, map: MapDef): GameState {
  const enemies = state.enemies.map(enemy => {
    if (enemy.hp <= 0) return enemy;

    const prevReverseTimer = enemy.reverseTimer;
    const newReverseTimer = Math.max(0, enemy.reverseTimer - dt);
    const newReverseImmunity = prevReverseTimer > 0 && newReverseTimer === 0
      ? 7
      : Math.max(0, enemy.reverseImmunityTimer - dt);

    let e = {
      ...enemy,
      slowTimer:            Math.max(0, enemy.slowTimer - dt),
      poisonTimer:          Math.max(0, enemy.poisonTimer - dt),
      stunTimer:            Math.max(0, enemy.stunTimer - dt),
      reverseTimer:         newReverseTimer,
      reverseImmunityTimer: newReverseImmunity,
    };

    // Apply poison even while stunned
    if (enemy.poisonTimer > 0) {
      e = applyDamageToEnemy(e, enemy.poisonDps * dt);
    }

    if (e.stunTimer > 0) return e;

    const effectiveSpeed = enemy.slowTimer > 0 ? e.speed * e.activeSlowFactor : e.speed;
    const isReversing = enemy.reverseTimer > 0;

    if (isReversing) {
      // Move backwards within the current segment only; clamp at 0
      const newProgress = Math.max(0, e.segmentProgress - effectiveSpeed * dt);
      return { ...e, segmentProgress: newProgress };
    }

    // Move forward
    const segment = map.segments.find(s => s.id === e.segmentId);
    if (!segment) return e;

    const newProgress = e.segmentProgress + effectiveSpeed * dt;
    const newTotal = e.totalProgress + effectiveSpeed * dt;

    if (newProgress >= segment.tiles.length - 1) {
      // Reached end of this segment
      if (segment.nextSegmentIds.length === 0) {
        // Terminal segment — enemy exits
        return {
          ...e,
          segmentProgress: segment.tiles.length - 1,
          totalProgress: newTotal,
          hp: 0,
          exited: true,
        };
      }
      // Pick a random next segment
      const nextId = segment.nextSegmentIds[
        Math.floor(Math.random() * segment.nextSegmentIds.length)
      ];
      return {
        ...e,
        segmentId: nextId,
        segmentProgress: 0,
        totalProgress: newTotal,
      };
    }

    return { ...e, segmentProgress: newProgress, totalProgress: newTotal };
  });

  return { ...state, enemies };
}

// ─── Tower attacks ────────────────────────────────────────────────────────────

function computeDamage(tower: PlacedTower, config: GameConfig, isCrit: boolean): number {
  const stats = BASE_TOWER_STATS[tower.type];
  let dmg = stats.damage * config.globalDamageMultiplier;
  if (tower.type === 'thorn_bush') dmg *= config.thornDamageMultiplier;
  if (isCrit) dmg *= 2;
  return dmg;
}

function tickTowerAttacks(
  state: GameState,
  dt: number,
  config: GameConfig,
  map: MapDef,
): GameState {
  let enemies = [...state.enemies];

  const towers = state.towers.map(tower => {
    const stats = BASE_TOWER_STATS[tower.type];

    if (tower.type === 'sunflower') return tower;

    const newCooldown = tower.cooldownTimer - dt * config.globalSpeedMultiplier;
    if (newCooldown > 0) return { ...tower, cooldownTimer: newCooldown };

    let range = stats.range;
    if (tower.type === 'beehive') range *= config.hiveRangeMultiplier;

    if (stats.aoe) {
      const targets = findTargetsInRadius(tower.col, tower.row, range, enemies, map);
      if (targets.length === 0) return tower;

      const damage = computeDamage(tower, config, false);
      const targetIds = new Set(targets.map(t => t.id));
      enemies = enemies.map(e => {
        if (!targetIds.has(e.id)) return e;
        let updated = damage > 0 ? applyDamageToEnemy(e, damage) : e;
        if (stats.slowFactor > 0) {
          const slowDur = stats.slowDuration * config.sprinklerDurationMultiplier;
          updated = { ...updated, slowTimer: Math.max(updated.slowTimer, slowDur), activeSlowFactor: stats.slowFactor };
        }
        return updated;
      });
      return { ...tower, cooldownTimer: stats.cooldown / config.globalSpeedMultiplier };
    }

    const target = findTarget(tower, enemies, range, map);
    if (!target) return tower;

    const isCrit = tower.type === 'cactus' && Math.random() < config.cactusCritChance;
    const damage = computeDamage(tower, config, isCrit);

    enemies = enemies.map(e => {
      if (e.id !== target.id) return e;
      let updated = damage > 0 ? applyDamageToEnemy(e, damage) : e;
      if (stats.poisonDps > 0)       updated = { ...updated, poisonTimer: stats.poisonDuration, poisonDps: stats.poisonDps };
      if (stats.stunDuration > 0)    updated = { ...updated, stunTimer: stats.stunDuration };
      if (stats.reverseDuration > 0 && updated.reverseTimer <= 0 && updated.reverseImmunityTimer <= 0) {
        updated = { ...updated, reverseTimer: stats.reverseDuration };
      }
      if (stats.slowFactor > 0) {
        const slowDur = stats.slowDuration * config.sprinklerDurationMultiplier;
        updated = { ...updated, slowTimer: Math.max(updated.slowTimer, slowDur), activeSlowFactor: stats.slowFactor };
      }
      return updated;
    });

    if (tower.type === 'watering_can') {
      const ePos = getEnemyGridPos(target, map);
      const chainTargets = findTargetsInRadius(ePos.col, ePos.row, 2, enemies.filter(e => e.id !== target.id), map).slice(0, 2);
      const chainIds = new Set(chainTargets.map(t => t.id));
      const slowDur = stats.slowDuration * config.sprinklerDurationMultiplier;
      enemies = enemies.map(e => {
        if (!chainIds.has(e.id)) return e;
        return { ...e, slowTimer: Math.max(e.slowTimer, slowDur), activeSlowFactor: stats.slowFactor };
      });
    }

    return { ...tower, cooldownTimer: stats.cooldown / config.globalSpeedMultiplier };
  });

  return { ...state, enemies, towers };
}

// ─── Sunflower income ─────────────────────────────────────────────────────────

function tickSunflowers(state: GameState, dt: number, config: GameConfig): GameState {
  let gold = state.gold;
  const towers = state.towers.map(tower => {
    if (tower.type !== 'sunflower') return tower;
    const stats = BASE_TOWER_STATS['sunflower'];
    const newTimer = tower.incomeTimer - dt;
    if (newTimer <= 0) {
      gold += Math.round(stats.incomeAmount * config.sunflowerIncomeMultiplier);
      return { ...tower, incomeTimer: stats.incomeInterval + newTimer };
    }
    return { ...tower, incomeTimer: newTimer };
  });
  return { ...state, gold, towers };
}

// ─── Collect dead/exited enemies ──────────────────────────────────────────────

export function collectDeadEnemies(state: GameState, map: MapDef, config: GameConfig): GameState {
  let gold = state.gold;
  let enemiesKilledThisRun = state.enemiesKilledThisRun;
  let lives = state.lives;
  let petalsThisRun = state.petalsThisRun;

  const survivors = state.enemies.filter(e => {
    if (e.hp > 0) return true;

    if (e.exited) {
      lives = Math.max(0, lives - 1);
    } else {
      const stats = BASE_ENEMY_STATS[e.type];
      gold += stats.goldReward;
      enemiesKilledThisRun += 1;
      if (e.type === 'boss_snail') {
        petalsThisRun += Math.round(config.bossDropsPetals * map.petalMultiplier);
      }
    }
    return false;
  });

  const seedsThisRun = Math.floor(
    calculateSeeds(state.wave, enemiesKilledThisRun) * map.seedMultiplier
  );

  return { ...state, enemies: survivors, gold, lives, enemiesKilledThisRun, seedsThisRun, petalsThisRun };
}

// ─── Phase ticks ─────────────────────────────────────────────────────────────

export function tickPrep(state: GameState, dt: number): GameState {
  const prepTimer = state.prepTimer - dt;
  if (prepTimer <= 0) {
    return {
      ...state,
      phase: 'wave',
      prepTimer: 0,
      pendingSpawns: buildWave(state.wave),
      spawnTimer: 0,
    };
  }
  return { ...state, prepTimer };
}

export function tickWaveCountdown(state: GameState, dt: number): GameState {
  const waveCountdownTimer = state.waveCountdownTimer - dt;
  if (waveCountdownTimer <= 0) {
    const nextWave = state.wave + 1;
    return {
      ...state,
      phase: 'wave',
      wave: nextWave,
      waveCountdownTimer: 0,
      pendingSpawns: buildWave(nextWave),
      spawnTimer: 0,
    };
  }
  return { ...state, waveCountdownTimer };
}

// ─── Main tick ────────────────────────────────────────────────────────────────

export function tick(
  state: GameState,
  dt: number,
  config: GameConfig,
  map: MapDef,
): GameState {
  if (state.lives <= 0 && state.phase !== 'run_end') {
    return { ...state, phase: 'run_end' };
  }

  if (state.phase === 'prep')           return tickPrep(state, dt);
  if (state.phase === 'wave_countdown') return tickWaveCountdown(state, dt);

  if (state.phase === 'wave') {
    let s = spawnDueEnemies(state, dt, map);
    s = tickEnemyMovement(s, dt, map);
    s = tickTowerAttacks(s, dt, config, map);
    s = tickSunflowers(s, dt, config);
    s = collectDeadEnemies(s, map, config);

    if (s.lives <= 0) return { ...s, phase: 'run_end' };

    if (s.pendingSpawns.length === 0 && s.enemies.length === 0) {
      const isBossWave = state.wave % 10 === 0;
      return {
        ...s,
        phase: 'wave_countdown',
        waveCountdownTimer: WAVE_COUNTDOWN,
        lives: isBossWave ? s.lives + 1 : s.lives,
      };
    }

    return s;
  }

  return state;
}
