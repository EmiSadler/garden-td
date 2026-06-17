import type { GameState } from '../types';
import { GRID_COLS, GRID_ROWS, TILE_SIZE } from '../constants';
import GameTile from './GameTile';
import EnemySprite from './EnemySprite';

interface Props {
  state: GameState;
  onTileClick: (col: number, row: number) => void;
  onTowerClick: (id: string) => void;
}

export default function GameBoard({ state, onTileClick, onTowerClick }: Props) {
  const towerByPos = new Map(state.towers.map(t => [`${t.col},${t.row}`, t]));

  return (
    <div className="relative overflow-hidden" style={{ width: GRID_COLS * TILE_SIZE, height: GRID_ROWS * TILE_SIZE }}>
      <div
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, ${TILE_SIZE}px)` }}
      >
        {Array.from({ length: GRID_ROWS }, (_, row) =>
          Array.from({ length: GRID_COLS }, (_, col) => (
            <GameTile
              key={`${col}-${row}`}
              col={col}
              row={row}
              tower={towerByPos.get(`${col},${row}`)}
              selectedTowerType={state.selectedTowerType}
              onClick={() => onTileClick(col, row)}
              onTowerClick={onTowerClick}
            />
          ))
        )}
      </div>

      {state.enemies.map(enemy => (
        <EnemySprite key={enemy.id} enemy={enemy} />
      ))}

      {state.selectedTowerType && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-green-400 opacity-50" />
      )}
    </div>
  );
}
