import type { PlacedTower, TowerType } from '../types';
import { BASE_TOWER_STATS, TILE_SIZE } from '../constants';

interface Props {
  col: number;
  row: number;
  tower: PlacedTower | undefined;
  selectedTowerType: TowerType | null;
  isOnPath: boolean;
  isExit: boolean;
  isEntry: boolean;
  isSelected: boolean;
  onClick: () => void;
  onTowerClick: (id: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// A single 48×48 grid cell. Renders as path (amber), grass, or a highlighted placement target.
// When a tower occupies the cell, its emoji span is re-keyed on fireCount so React remounts it
// each time the tower fires — this re-triggers the CSS animation without needing JS timers.
// isSelected applies a yellow inset ring to show which tower the TowerInfoModal refers to.
export default function GameTile({
  col: _col, row: _row, tower, selectedTowerType,
  isOnPath, isExit, isEntry, isSelected,
  onClick, onTowerClick, onMouseEnter, onMouseLeave,
}: Props) {
  const canPlace = !isOnPath && !tower && selectedTowerType;

  let bg = 'bg-green-700 hover:bg-green-600';
  if (isOnPath) bg = 'bg-amber-800';
  if (canPlace) bg = 'bg-green-500 cursor-pointer';

  return (
    <div
      className={`${bg} border border-green-900/30 flex items-center justify-center text-2xl select-none transition-colors`}
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        boxShadow: isSelected ? 'inset 0 0 0 2px #facc15, inset 0 0 8px #facc1580' : undefined,
      }}
      onClick={() => {
        if (tower) { onTowerClick(tower.id); return; }
        onClick();
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isExit && !tower && <span title="Garden Heart">🌷</span>}
      {isEntry && !tower && <span className="opacity-40 text-sm">▶</span>}
      {tower && (
        // key={tower.fireCount} forces React to remount this span each time the tower fires,
        // re-triggering the CSS keyframe animation from the start without any JS timer.
        <span
          key={tower.fireCount}
          title={BASE_TOWER_STATS[tower.type].label}
          className={`cursor-pointer ${
            tower.type === 'sunflower'
              ? 'animate-tower-income'
              : tower.lastFireWasCrit
                ? 'animate-tower-crit'
                : 'animate-tower-pulse'
          }`}
        >
          {BASE_TOWER_STATS[tower.type].emoji}
        </span>
      )}
    </div>
  );
}
