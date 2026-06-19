import { useState } from 'react';
import { useTechTree } from './hooks/useTechTree';
import { useGameState } from './hooks/useGameState';
import GameBoard from './components/GameBoard';
import HUD from './components/HUD';
import TowerPanel from './components/TowerPanel';
import TowerInfoModal from './components/TowerInfoModal';
import RunEndOverlay from './components/RunEndOverlay';
import TechTreeOverlay from './components/TechTreeOverlay';
import MapSelectScreen from './components/MapSelectScreen';

export default function App() {
  const { techTree, gameConfig, addSeeds, unlockNode } = useTechTree();
  const [selectedMapId, setSelectedMapId] = useState<number | null>(
    gameConfig.unlockedMapIds.length === 1 ? 1 : null
  );
  const { state, map, selectTowerType, placeTower, selectTower, sellTower, restartRun } =
    useGameState(gameConfig, selectedMapId ?? 1);

  const [showTechTree, setShowTechTree] = useState(false);
  const [techTreeOpenedFromRunEnd, setTechTreeOpenedFromRunEnd] = useState(false);
  const [seedsAwarded, setSeedsAwarded] = useState(false);

  if (selectedMapId === null) {
    return (
      <MapSelectScreen
        unlockedMapIds={gameConfig.unlockedMapIds}
        onSelect={id => setSelectedMapId(id)}
      />
    );
  }

  const selectedTower = state.selectedTowerId
    ? state.towers.find(t => t.id === state.selectedTowerId)
    : undefined;

  const handleOpenTechTree = () => {
    if (!seedsAwarded) { addSeeds(state.seedsThisRun); setSeedsAwarded(true); }
    setTechTreeOpenedFromRunEnd(true);
    setShowTechTree(true);
  };

  const handleRestartRun = () => {
    if (!seedsAwarded) { addSeeds(state.seedsThisRun); setSeedsAwarded(true); }
    setSeedsAwarded(false);
    if (gameConfig.unlockedMapIds.length > 1) {
      setSelectedMapId(null);
    } else {
      restartRun(selectedMapId);
    }
  };

  const handleCloseTechTree = () => {
    setShowTechTree(false);
    setTechTreeOpenedFromRunEnd(false);
    if (techTreeOpenedFromRunEnd) {
      setSeedsAwarded(false);
      if (gameConfig.unlockedMapIds.length > 1) {
        setSelectedMapId(null);
      } else {
        restartRun(selectedMapId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-4">
      <div className="relative flex flex-col" style={{ border: '2px solid #166534', borderRadius: 8 }}>
        <HUD state={state} />

        <div className="relative">
          <GameBoard
            state={state}
            map={map}
            onTileClick={(col, row) => {
              if (state.selectedTowerType) placeTower(col, row);
              else selectTower(null);
            }}
            onTowerClick={id => selectTower(id)}
          />

          {selectedTower && (
            <TowerInfoModal
              tower={selectedTower}
              config={gameConfig}
              onSell={() => sellTower(selectedTower.id)}
              onClose={() => selectTower(null)}
            />
          )}

          {state.phase === 'run_end' && (
            <RunEndOverlay
              wave={state.wave}
              enemiesKilled={state.enemiesKilledThisRun}
              seedsEarned={state.seedsThisRun}
              onOpenTechTree={handleOpenTechTree}
              onRestart={handleRestartRun}
            />
          )}
        </div>

        <TowerPanel
          gold={state.gold}
          selectedTowerType={state.selectedTowerType}
          config={gameConfig}
          onSelect={selectTowerType}
        />
      </div>

      <div className="mt-4 flex gap-4 items-center">
        <button
          onClick={() => setShowTechTree(true)}
          className="text-green-400 hover:text-green-200 text-sm underline"
        >
          🌱 Tech Tree ({techTree.seeds} seeds)
        </button>
        {gameConfig.unlockedMapIds.length > 1 && (
          <button
            onClick={() => setSelectedMapId(null)}
            className="text-green-400 hover:text-green-200 text-sm underline"
          >
            🗺️ Change Map
          </button>
        )}
      </div>

      {showTechTree && (
        <TechTreeOverlay
          techTree={techTree}
          onUnlock={unlockNode}
          onClose={handleCloseTechTree}
        />
      )}
    </div>
  );
}
