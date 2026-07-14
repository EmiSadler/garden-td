import { useRef, useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'garden_td_settings';

export type SoundName =
  | 'place_tower' | 'sell_tower'
  | 'enemy_die' | 'life_lost'
  | 'wave_start' | 'wave_clear'
  | 'unlock_node' | 'prestige';

export interface AudioSettings {
  sfxVolume: number;   // 0–1
  sfxMuted: boolean;
  musicVolume: number; // 0–1 (reserved for future music files)
  musicMuted: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = {
  sfxVolume: 0.7,
  sfxMuted: false,
  musicVolume: 0.5,
  musicMuted: false,
};

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ─── Sound synthesis helpers ─────────────────────────────────────────────────

// Schedules a single oscillator note: freq at `t`, decaying to silence by `t + duration`.
function note(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  freqEnd: number,
  startTime: number,
  duration: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (freqEnd !== freq) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
  }
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

// Schedules a quick ascending chirp — snappy placement confirmation.
function playPlaceTower(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  note(ctx, 'sine', 440, 880, t, 0.1, vol * 0.35);
}

// Descending chirp — "returning" something.
function playSellTower(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  note(ctx, 'sine', 700, 350, t, 0.12, vol * 0.3);
}

// Short square-wave fall — small punchy death blip.
function playEnemyDie(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  note(ctx, 'square', 280, 70, t, 0.08, vol * 0.15);
}

// Low sine thud + brief sawtooth buzz — alarming but not grating.
function playLifeLost(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  note(ctx, 'sine',     130, 50,  t,        0.35, vol * 0.5);
  note(ctx, 'sawtooth', 200, 80,  t + 0.02, 0.18, vol * 0.2);
}

// Three-note ascending arpeggio (C4–E4–G4) — anticipation.
function playWaveStart(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  [261.63, 329.63, 392.00].forEach((freq, i) => {
    note(ctx, 'sine', freq, freq, t + i * 0.09, 0.14, vol * 0.3);
  });
}

// Four-note bright fanfare (C5–E5–G5–C6) — triumphant wave clear.
function playWaveClear(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    note(ctx, 'sine', freq, freq, t + i * 0.11, 0.18, vol * 0.3);
  });
}

// Bell-like ping — node unlocked.
function playUnlockNode(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  note(ctx, 'triangle', 880, 1320, t,        0.05, vol * 0.4);
  note(ctx, 'triangle', 880, 880,  t + 0.04, 0.35, vol * 0.3);
}

// Ascending shimmer across five harmonics — magical prestige feeling.
function playPrestige(ctx: AudioContext, vol: number) {
  const t = ctx.currentTime;
  [440, 554.37, 659.25, 880, 1108.73].forEach((freq, i) => {
    note(ctx, 'sine', freq, freq * 1.5, t + i * 0.08, 0.45, vol * 0.22);
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

// Manages Web Audio API context (created lazily on first user interaction — browser requirement)
// and synthesised sound effects. Also owns audio settings with localStorage persistence.
export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [audioSettings, setAudioSettingsState] = useState<AudioSettings>(loadSettings);

  // Persist settings to localStorage whenever they change.
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(audioSettings));
  }, [audioSettings]);

  const setAudioSettings = useCallback((update: Partial<AudioSettings>) => {
    setAudioSettingsState(prev => ({ ...prev, ...update }));
  }, []);

  // Returns the AudioContext, creating or resuming it as needed.
  // Must be called from within a user-gesture handler (click, keydown) on first use.
  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume();
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  const playSound = useCallback((name: SoundName) => {
    if (audioSettings.sfxMuted || audioSettings.sfxVolume === 0) return;
    const ctx = getCtx();
    if (!ctx) return;
    const vol = audioSettings.sfxVolume;

    switch (name) {
      case 'place_tower':  playPlaceTower(ctx, vol);  break;
      case 'sell_tower':   playSellTower(ctx, vol);   break;
      case 'enemy_die':    playEnemyDie(ctx, vol);    break;
      case 'life_lost':    playLifeLost(ctx, vol);    break;
      case 'wave_start':   playWaveStart(ctx, vol);   break;
      case 'wave_clear':   playWaveClear(ctx, vol);   break;
      case 'unlock_node':  playUnlockNode(ctx, vol);  break;
      case 'prestige':     playPrestige(ctx, vol);    break;
    }
  }, [audioSettings.sfxMuted, audioSettings.sfxVolume, getCtx]);

  return { playSound, audioSettings, setAudioSettings };
}
