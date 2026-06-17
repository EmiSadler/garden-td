import type { PlacedTower, GameConfig } from '../types';
import { BASE_TOWER_STATS, SELL_REFUND } from '../constants';

interface Props {
  tower: PlacedTower;
  config: GameConfig;
  onSell: () => void;
  onClose: () => void;
}

export default function TowerInfoModal({ tower, config, onSell, onClose }: Props) {
  const stats = BASE_TOWER_STATS[tower.type];
  const cost = Math.round(stats.cost * config.costMultiplier);
  const refund = Math.round(cost * SELL_REFUND);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-20 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-green-950 border border-green-700 rounded-xl p-5 w-64 space-y-3 text-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">{stats.emoji}</span>
          <div>
            <h3 className="font-bold text-lg">{stats.label}</h3>
            <p className="text-green-400 text-xs">Cost: {cost}g</p>
          </div>
        </div>
        <div className="text-sm text-green-200 space-y-1">
          {stats.damage > 0 && <p>⚔️ Damage: {stats.damage}{stats.aoe ? ' (AoE)' : ''}</p>}
          {stats.range > 0 && <p>📏 Range: {stats.range} tiles</p>}
          {stats.cooldown > 0 && <p>⏱ Attack speed: every {stats.cooldown}s</p>}
          {stats.incomeAmount > 0 && <p>💰 Income: {stats.incomeAmount}g every {stats.incomeInterval}s</p>}
          {stats.slowFactor > 0 && <p>🧊 Slows enemies by {Math.round(stats.slowFactor * 100)}% for {stats.slowDuration}s</p>}
          {stats.poisonDps > 0 && <p>☠️ Poisons: {stats.poisonDps} DPS for {stats.poisonDuration}s</p>}
          {stats.stunDuration > 0 && <p>⚡ Stuns for {stats.stunDuration}s</p>}
          {stats.reverseDuration > 0 && <p>↩️ Reverses direction for {stats.reverseDuration}s</p>}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onSell}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white rounded-lg py-1.5 text-sm font-semibold transition-colors"
          >
            Sell (+{refund}g)
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-green-800 hover:bg-green-700 text-white rounded-lg py-1.5 text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
