import type { GameState } from '../types';

interface Props {
  state: GameState;
}

export default function HUD({ state }: Props) {
  const phaseLabel =
    state.phase === 'prep'           ? `⏱ ${Math.ceil(state.prepTimer)}s — place your first towers!` :
    state.phase === 'wave_countdown' ? `Next wave in ${Math.ceil(state.waveCountdownTimer)}s…` :
    state.phase === 'wave'           ? `Wave ${state.wave} — defend!` : '';

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-green-950 text-white text-sm font-medium shrink-0">
      <span>❤️ {state.lives}</span>
      <span>💰 {state.gold}g</span>
      <span className="font-bold">Wave {state.wave}</span>
      <span>🌱 {state.seedsThisRun}</span>
      <span className="ml-auto text-green-300 text-xs">{phaseLabel}</span>
    </div>
  );
}
