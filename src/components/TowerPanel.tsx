import { useState } from 'react';
import type { TowerType, GameConfig } from '../types';
import { BASE_TOWER_STATS } from '../constants';

interface Props {
  gold: number;
  selectedTowerType: TowerType | null;
  config: GameConfig;
  onSelect: (type: TowerType | null) => void;
}

// Popup showing full stats for a tower type when the player hovers its button.
function TowerTooltip({ type }: { type: TowerType }) {
  const stats = BASE_TOWER_STATS[type];
  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-900 border border-green-700 rounded-lg p-3 text-xs text-white z-50 shadow-xl pointer-events-none">
      <p className="font-bold text-sm mb-1">{stats.emoji} {stats.label}</p>
      {stats.damage > 0 && (
        <p>⚔️ {stats.damage} dmg{stats.aoe ? ` (AoE r${stats.aoeRadius})` : ''} every {stats.cooldown}s</p>
      )}
      {stats.range > 0 && <p>📏 Range: {stats.range} tiles</p>}
      {stats.incomeAmount > 0 && <p>💰 +{stats.incomeAmount}g every {stats.incomeInterval}s</p>}
      {stats.slowFactor > 0 && <p>🧊 Slows {Math.round(stats.slowFactor * 100)}% for {stats.slowDuration}s</p>}
      {stats.poisonDps > 0 && <p>☠️ Poison {stats.poisonDps} DPS for {stats.poisonDuration}s</p>}
      {stats.stunDuration > 0 && <p>⚡ Stuns for {stats.stunDuration}s</p>}
      {stats.reverseDuration > 0 && <p>↩️ Reverses for {stats.reverseDuration}s</p>}
    </div>
  );
}

// Bottom bar listing all unlocked tower types. Clicking a button enters placement mode;
// clicking the selected button again deselects it. Unaffordable towers are disabled.
// Shown cost is adjusted by the costMultiplier from the config (prestige + tech bonuses).
export default function TowerPanel({ gold, selectedTowerType, config, onSelect }: Props) {
  const [hoveredType, setHoveredType] = useState<TowerType | null>(null);

  return (
    <div className="flex gap-2 px-4 py-2 bg-green-950 border-t border-green-800 shrink-0 flex-wrap">
      {config.unlockedTowers.map(type => {
        const stats = BASE_TOWER_STATS[type];
        const cost = Math.round(stats.cost * config.costMultiplier);
        const affordable = gold >= cost;
        const selected = selectedTowerType === type;

        return (
          <div
            key={type}
            className="relative"
            onMouseEnter={() => setHoveredType(type)}
            onMouseLeave={() => setHoveredType(null)}
          >
            {hoveredType === type && <TowerTooltip type={type} />}
            <button
              onClick={() => onSelect(selected ? null : type)}
              disabled={!affordable}
              className={`flex flex-col items-center px-3 py-1.5 rounded-lg border text-xs transition-all ${
                selected
                  ? 'bg-yellow-400 border-yellow-300 text-black'
                  : affordable
                    ? 'bg-green-800 border-green-600 text-white hover:bg-green-700'
                    : 'bg-green-900 border-green-800 text-green-600 cursor-not-allowed opacity-50'
              }`}
            >
              <span className="text-xl">{stats.emoji}</span>
              <span className="font-semibold">{stats.label}</span>
              <span>💰 {cost}g</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
