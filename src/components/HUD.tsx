import type { GameState } from '../types';

interface Props {
  state: GameState;
  totalPetals: number;
  speed: number;
  slowMotionUnlocked: boolean;
  onSetSpeed: (s: number) => void;
  onPrestige: () => void;
}

const SPEEDS = [
  { value: 1 / 3, label: '⅓×' },
  { value: 1,     label: '1×' },
  { value: 3,     label: '3×' },
  { value: 5,     label: '5×' },
];

// Top-bar HUD showing live stats, speed controls, and the prestige button.
// Petal count combines persisted total with any petals earned this run (not yet awarded).
// ⅓× speed is hidden unless the slow_motion prestige node has been unlocked.
export default function HUD({ state, totalPetals, speed, slowMotionUnlocked, onSetSpeed, onPrestige }: Props) {
  const phaseLabel =
    state.phase === 'prep'           ? `⏱ ${Math.ceil(state.prepTimer)}s — place your first towers!` :
    state.phase === 'wave_countdown' ? `Next wave in ${Math.ceil(state.waveCountdownTimer)}s…` :
    state.phase === 'wave'           ? `Wave ${state.wave} — defend!` : '';

  const displayPetals = totalPetals + state.petalsThisRun;
  const visibleSpeeds = SPEEDS.filter(s => s.value !== 1 / 3 || slowMotionUnlocked);

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-green-950 text-white text-sm font-medium shrink-0">
      <span>❤️ {state.lives}</span>
      <span>💰 {state.gold}g</span>
      <span className="font-bold">Wave {state.wave}</span>
      <span>🌱 {state.seedsThisRun}</span>
      <span className="text-pink-300">🌸 {displayPetals}</span>

      <div className="flex items-center gap-0.5">
        {visibleSpeeds.map(s => (
          <button
            key={s.value}
            onClick={() => onSetSpeed(s.value)}
            className={`text-xs px-2 py-0.5 rounded font-bold transition-colors ${
              speed === s.value
                ? 'bg-green-400 text-green-950'
                : 'bg-green-800 text-green-300 hover:bg-green-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <span className="ml-auto flex items-center gap-3">
        {/* Prestige button is only visible once the player has earned at least one petal */}
        {displayPetals >= 1 && (
          <button
            onClick={onPrestige}
            className="bg-pink-700 hover:bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
          >
            ✨ Prestige
          </button>
        )}
        <span className="text-green-300 text-xs">{phaseLabel}</span>
      </span>
    </div>
  );
}
