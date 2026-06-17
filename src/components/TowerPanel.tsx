import type { TowerType, GameConfig } from '../types';
import { BASE_TOWER_STATS } from '../constants';

interface Props {
  gold: number;
  selectedTowerType: TowerType | null;
  config: GameConfig;
  onSelect: (type: TowerType | null) => void;
}

export default function TowerPanel({ gold, selectedTowerType, config, onSelect }: Props) {
  return (
    <div className="flex gap-2 px-4 py-2 bg-green-950 border-t border-green-800 shrink-0 flex-wrap">
      {config.unlockedTowers.map(type => {
        const stats = BASE_TOWER_STATS[type];
        const cost = Math.round(stats.cost * config.costMultiplier);
        const affordable = gold >= cost;
        const selected = selectedTowerType === type;

        return (
          <button
            key={type}
            onClick={() => onSelect(selected ? null : type)}
            disabled={!affordable}
            title={stats.label}
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
        );
      })}
    </div>
  );
}
