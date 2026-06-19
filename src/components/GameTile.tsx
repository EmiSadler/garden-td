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
  onClick: () => void;
  onTowerClick: (id: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function GameTile({
  col: _col, row: _row, tower, selectedTowerType,
  isOnPath, isExit, isEntry,
  onClick, onTowerClick, onMouseEnter, onMouseLeave,
}: Props) {
  const canPlace = !isOnPath && !tower && selectedTowerType;

  let bg = 'bg-green-700 hover:bg-green-600';
  if (isOnPath) bg = 'bg-amber-800';
  if (canPlace) bg = 'bg-green-500 cursor-pointer';

  return (
    <div
      className={`${bg} border border-green-900/30 flex items-center justify-center text-2xl select-none transition-colors`}
      style={{ width: TILE_SIZE, height: TILE_SIZE }}
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
        <span title={BASE_TOWER_STATS[tower.type].label} className="cursor-pointer hover:scale-110 transition-transform">
          {BASE_TOWER_STATS[tower.type].emoji}
        </span>
      )}
    </div>
  );
}
