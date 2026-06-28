import type { GameState } from '../types';

interface Props {
  state: GameState;
  totalPetals: number;
  onPrestige: () => void;
}

export default function HUD({ state, totalPetals, onPrestige }: Props) {
  const phaseLabel =
    state.phase === 'prep'           ? `⏱ ${Math.ceil(state.prepTimer)}s — place your first towers!` :
    state.phase === 'wave_countdown' ? `Next wave in ${Math.ceil(state.waveCountdownTimer)}s…` :
    state.phase === 'wave'           ? `Wave ${state.wave} — defend!` : '';

  const displayPetals = totalPetals + state.petalsThisRun;

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-green-950 text-white text-sm font-medium shrink-0">
      <span>❤️ {state.lives}</span>
      <span>💰 {state.gold}g</span>
      <span className="font-bold">Wave {state.wave}</span>
      <span>🌱 {state.seedsThisRun}</span>
      <span className="text-pink-300">🌸 {displayPetals}</span>
      <span className="ml-auto flex items-center gap-3">
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
