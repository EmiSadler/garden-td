import { useState, useCallback } from 'react';
import { useTechTree } from './hooks/useTechTree';
import { useGameState } from './hooks/useGameState';
import { usePrestige } from './hooks/usePrestige';
import { computeGameConfig, computePrestigeConfig } from './gameConfig';
import GameBoard from './components/GameBoard';
import HUD from './components/HUD';
import TowerPanel from './components/TowerPanel';
import TowerInfoModal from './components/TowerInfoModal';
import RunEndOverlay from './components/RunEndOverlay';
import TechTreeOverlay from './components/TechTreeOverlay';
import MapSelectScreen from './components/MapSelectScreen';
import PrestigeOverlay from './components/PrestigeOverlay';

type PrestigeOverlayMode = 'confirm' | 'tree' | null;

export default function App() {
  const { prestigeState, addPetals, unlockPrestigeNode, prestige } = usePrestige();
  const prestigeConfig = computePrestigeConfig(prestigeState.unlocked);

  const { techTree, addSeeds, unlockNode, resetWithSeeds } = useTechTree(prestigeConfig.techNodeCostMultiplier);
  const gameConfig = computeGameConfig(techTree.unlocked, prestigeConfig);

  const [selectedMapId, setSelectedMapId] = useState<number | null>(
    gameConfig.unlockedMapIds.length === 1 ? 1 : null
  );
  const { state, map, selectTowerType, placeTower, selectTower, sellTower, restartRun } =
    useGameState(gameConfig, selectedMapId ?? 1);

  const [showTechTree, setShowTechTree] = useState(false);
  const [techTreeOpenedFromRunEnd, setTechTreeOpenedFromRunEnd] = useState(false);
  const [seedsAwarded, setSeedsAwarded] = useState(false);
  const [petalsAwarded, setPetalsAwarded] = useState(false);
  const [prestigeOverlayMode, setPrestigeOverlayMode] = useState<PrestigeOverlayMode>(null);

  const awardRunRewards = useCallback(() => {
    if (!seedsAwarded) { addSeeds(state.seedsThisRun); setSeedsAwarded(true); }
    if (!petalsAwarded) { addPetals(state.petalsThisRun); setPetalsAwarded(true); }
  }, [seedsAwarded, petalsAwarded, state.seedsThisRun, state.petalsThisRun, addSeeds, addPetals]);

  const resetRunRewards = () => { setSeedsAwarded(false); setPetalsAwarded(false); };

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
    awardRunRewards();
    setTechTreeOpenedFromRunEnd(true);
    setShowTechTree(true);
  };

  const handleRestartRun = () => {
    awardRunRewards();
    resetRunRewards();
    if (gameConfig.unlockedMapIds.length > 1) {
      setSelectedMapId(null);
    } else {
      restartRun(selectedMapId);
    }
  };

  const handleCloseTechTree = () => {
    setShowTechTree(false);
    if (techTreeOpenedFromRunEnd) {
      setTechTreeOpenedFromRunEnd(false);
      resetRunRewards();
      if (gameConfig.unlockedMapIds.length > 1) {
        setSelectedMapId(null);
      } else {
        restartRun(selectedMapId);
      }
    }
  };

  const handlePrestigeClick = () => setPrestigeOverlayMode('confirm');

  const handlePrestigeConfirm = () => {
    addPetals(state.petalsThisRun);
    setPetalsAwarded(true);
    const keptSeeds = prestige(techTree.seeds);
    resetWithSeeds(keptSeeds);
    setPrestigeOverlayMode('tree');
  };

  const handlePrestigeContinue = () => {
    setPrestigeOverlayMode(null);
    resetRunRewards();
    setSelectedMapId(null);
    restartRun(undefined);
  };

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-4">
      <div className="relative flex flex-col" style={{ border: '2px solid #166534', borderRadius: 8 }}>
        <HUD
          state={state}
          totalPetals={prestigeState.petals}
          onPrestige={handlePrestigeClick}
        />

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
              petalsEarned={state.petalsThisRun}
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
        <button
          onClick={() => setPrestigeOverlayMode('tree')}
          className="text-pink-400 hover:text-pink-200 text-sm underline"
        >
          🌸 Prestige Tree ({prestigeState.petals} petals)
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
          techNodeCostMultiplier={prestigeConfig.techNodeCostMultiplier}
          onUnlock={unlockNode}
          onClose={handleCloseTechTree}
        />
      )}

      {prestigeOverlayMode !== null && (
        <PrestigeOverlay
          mode={prestigeOverlayMode}
          currentSeeds={techTree.seeds}
          petalsThisRun={petalsAwarded ? 0 : state.petalsThisRun}
          prestigeState={prestigeState}
          prestigeConfig={prestigeConfig}
          onConfirm={handlePrestigeConfirm}
          onCancel={() => setPrestigeOverlayMode(null)}
          onUnlockNode={unlockPrestigeNode}
          onContinue={handlePrestigeContinue}
        />
      )}
    </div>
  );
}
