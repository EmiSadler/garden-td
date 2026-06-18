import type { PlacedTower, TowerType } from '../types';
import { BASE_TOWER_STATS, TILE_SIZE } from '../constants';
import { isTileOnPathFast, PATH_TILES } from '../mapData';

interface Props {
  col: number;
  row: number;
  tower: PlacedTower | undefined;
  selectedTowerType: TowerType | null;
  onClick: () => void;
  onTowerClick: (id: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const EXIT_TILE = PATH_TILES[PATH_TILES.length - 1];
const ENTRY_TILE = PATH_TILES[0];

export default function GameTile({ col, row, tower, selectedTowerType, onClick, onTowerClick, onMouseEnter, onMouseLeave }: Props) {
  const isPath = isTileOnPathFast(col, row);
  const isExit = EXIT_TILE.col === col && EXIT_TILE.row === row;
  const isEntry = ENTRY_TILE.col === col && ENTRY_TILE.row === row;
  const canPlace = !isPath && !tower && selectedTowerType;

  let bg = 'bg-green-700 hover:bg-green-600';
  if (isPath) bg = 'bg-amber-800';
  if (canPlace) bg = 'bg-green-500 cursor-pointer';

  return (
    <div
      className={`${bg} border border-green-900/30 flex items-center justify-center text-2xl select-none transition-colors`}
      style={{ width: TILE_SIZE, height: TILE_SIZE }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => {
        if (tower) { onTowerClick(tower.id); return; }
        onClick();
      }}
    >
      {isExit && !tower && <span title="Garden Heart">🌷</span>}
      {isEntry && !tower && <span className="opacity-40 text-sm">▶</span>}
      {tower && (
        <span
          title={BASE_TOWER_STATS[tower.type].label}
          className="cursor-pointer hover:scale-110 transition-transform"
        >
          {BASE_TOWER_STATS[tower.type].emoji}
        </span>
      )}
    </div>
  );
}
