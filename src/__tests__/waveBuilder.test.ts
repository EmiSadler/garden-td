import { describe, it, expect } from 'vitest';
import { buildWave, calculateSeeds } from '../waveBuilder';

describe('buildWave', () => {
  it('wave 1 contains only caterpillars', () => {
    const spawns = buildWave(1);
    expect(spawns.every(s => s.type === 'caterpillar')).toBe(true);
    expect(spawns.length).toBeGreaterThan(0);
  });

  it('wave 10 contains a boss_snail', () => {
    const spawns = buildWave(10);
    expect(spawns.some(s => s.type === 'boss_snail')).toBe(true);
  });

  it('wave 20 contains a boss_snail', () => {
    const spawns = buildWave(20);
    expect(spawns.some(s => s.type === 'boss_snail')).toBe(true);
  });

  it('wave 6 contains ladybugs (phase 1)', () => {
    const spawns = buildWave(6);
    expect(spawns.some(s => s.type === 'ladybug')).toBe(true);
  });

  it('later waves have more total enemies than earlier waves', () => {
    expect(buildWave(10).length).toBeGreaterThan(buildWave(1).length);
  });

  it('spawn delays are non-decreasing', () => {
    const spawns = buildWave(3);
    for (let i = 1; i < spawns.length; i++) {
      expect(spawns[i].delaySeconds).toBeGreaterThanOrEqual(spawns[i - 1].delaySeconds);
    }
  });
});

describe('calculateSeeds', () => {
  it('returns 0 if no waves survived', () => {
    expect(calculateSeeds(0, 50)).toBe(0);
  });

  it('returns 0 if fewer than 10 enemies killed', () => {
    expect(calculateSeeds(5, 9)).toBe(0);
  });

  it('calculates correctly', () => {
    // 5 waves × floor(30 / 10) = 5 × 3 = 15
    expect(calculateSeeds(5, 30)).toBe(15);
  });
});
