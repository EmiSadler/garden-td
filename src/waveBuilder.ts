import type { EnemyType, EnemySpawn } from './types';
import { SPAWN_INTERVAL } from './constants';

// Generates the timed spawn list for a given wave number.
// Total enemy count scales exponentially with wave (×1.3 each wave).
// Composition shifts across 4 phases every 4 waves: caterpillars → +ladybugs → +snails → mixed.
// Every 10th wave is a boss wave: a crowd of caterpillars plus one boss snail.
export function buildWave(wave: number): EnemySpawn[] {
  const baseCount = 5;
  const totalCount = Math.max(1, Math.floor(baseCount * Math.pow(1.3, wave - 1)));
  const isBoss = wave % 10 === 0;
  const phase = Math.floor((wave - 1) / 4);

  const groups: { type: EnemyType; count: number }[] = [];

  if (isBoss) {
    groups.push({ type: 'caterpillar', count: Math.floor(totalCount * 0.5) });
    groups.push({ type: 'boss_snail',  count: 1 });
  } else if (phase === 0) {
    groups.push({ type: 'caterpillar', count: totalCount });
  } else if (phase === 1) {
    groups.push({ type: 'caterpillar', count: Math.floor(totalCount * 0.6) });
    groups.push({ type: 'ladybug',     count: Math.ceil(totalCount * 0.4) });
  } else if (phase === 2) {
    groups.push({ type: 'caterpillar', count: Math.floor(totalCount * 0.3) });
    groups.push({ type: 'ladybug',     count: Math.floor(totalCount * 0.4) });
    groups.push({ type: 'snail',       count: Math.ceil(totalCount * 0.3) });
  } else {
    groups.push({ type: 'ladybug', count: Math.floor(totalCount * 0.4) });
    groups.push({ type: 'snail',   count: Math.ceil(totalCount * 0.4) });
    if (Math.floor(totalCount * 0.2) > 0) {
      groups.push({ type: 'boss_snail', count: 1 });
    }
  }

  // Assign increasing delay to each enemy so they trickle in one at a time.
  const spawns: EnemySpawn[] = [];
  let delay = 0;
  for (const { type, count } of groups) {
    for (let i = 0; i < count; i++) {
      spawns.push({ type, delaySeconds: delay });
      delay += SPAWN_INTERVAL;
    }
  }
  return spawns;
}

// Converts wave count and total kill count into a seed reward.
// Rewards players who survive longer AND kill more enemies each run.
export function calculateSeeds(wavessurvived: number, enemiesKilled: number): number {
  return wavessurvived * Math.floor(enemiesKilled / 10);
}
