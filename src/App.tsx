import { useState, useCallback, useEffect, useRef } from 'react';
import { useTechTree } from './hooks/useTechTree';
import { useGameState } from './hooks/useGameState';
import { usePrestige } from './hooks/usePrestige';
import { useAudio } from './hooks/useAudio';
import { loadSave, writeSave, clearSave } from './hooks/useSaveState';
import { computeGameConfig, computePrestigeConfig } from './gameConfig';
import GameBoard from './components/GameBoard';
import HUD from './components/HUD';
import TowerPanel from './components/TowerPanel';
import TowerInfoModal from './components/TowerInfoModal';
import RunEndOverlay from './components/RunEndOverlay';
import TechTreeOverlay from './components/TechTreeOverlay';
import MapSelectScreen from './components/MapSelectScreen';
import PrestigeOverlay from './components/PrestigeOverlay';
import MainMenu from './components/MainMenu';
import HowToScreen from './components/HowToScreen';
import SettingsOverlay from './components/SettingsOverlay';

type AppScreen = 'menu' | 'game' | 'how_to' | 'settings';
type PrestigeOverlayMode = 'confirm' | 'tree' | 'browse' | null;

// Root component. Owns all hooks, routes between screens, manages save/load, and
// wires audio events to game actions.
export default function App() {
  const { prestigeState, addPetals, unlockPrestigeNode, prestige } = usePrestige();
  const prestigeConfig = computePrestigeConfig(prestigeState.unlocked);

  const { techTree, addSeeds, unlockNode, resetWithSeeds } = useTechTree(prestigeConfig.techNodeCostMultiplier);
  const gameConfig = computeGameConfig(techTree.unlocked, prestigeConfig);

  const { playSound, audioSettings, setAudioSettings } = useAudio();

  const [appScreen, setAppScreen] = useState<AppScreen>('menu');
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);

  const { state, map, speed, setSpeed, selectTowerType, placeTower, selectTower, sellTower, restartRun, loadGame } =
    useGameState(gameConfig, selectedMapId ?? 1);

  const [showTechTree, setShowTechTree] = useState(false);
  const [techTreeOpenedFromRunEnd, setTechTreeOpenedFromRunEnd] = useState(false);
  const [seedsAwarded, setSeedsAwarded] = useState(false);
  const [petalsAwarded, setPetalsAwarded] = useState(false);
  const [prestigeOverlayMode, setPrestigeOverlayMode] = useState<PrestigeOverlayMode>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ─── Save / load ───────────────────────────────────────────────────────────

  // Snapshot state into localStorage whenever the phase becomes wave_countdown (after each wave).
  // Also clear the save on run_end so Continue isn't offered for a finished run.
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (appScreen !== 'game' || state.phase === prevPhaseRef.current) return;
    prevPhaseRef.current = state.phase;

    if (state.phase === 'wave_countdown') {
      writeSave(state, selectedMapId ?? 1);
    }
    if (state.phase === 'run_end') {
      clearSave();
    }
  }, [state.phase, appScreen, state, selectedMapId]);

  // Flush a save on page unload (covers mid-wave refreshes) using refs so the effect
  // only needs to register once.
  const stateSnapshotRef = useRef(state);
  stateSnapshotRef.current = state;
  const appScreenRef = useRef(appScreen);
  appScreenRef.current = appScreen;
  const selectedMapIdRef = useRef(selectedMapId);
  selectedMapIdRef.current = selectedMapId;

  useEffect(() => {
    const handler = () => {
      if (appScreenRef.current === 'game' && stateSnapshotRef.current.phase !== 'run_end') {
        writeSave(stateSnapshotRef.current, selectedMapIdRef.current ?? 1);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // ─── Phase sounds ──────────────────────────────────────────────────────────

  const prevPhaseSoundRef = useRef(state.phase);
  useEffect(() => {
    if (appScreen !== 'game' || state.phase === prevPhaseSoundRef.current) return;
    prevPhaseSoundRef.current = state.phase;
    if (state.phase === 'wave')           playSound('wave_start');
    if (state.phase === 'wave_countdown') playSound('wave_clear');
  }, [state.phase, appScreen, playSound]);

  // ─── Menu actions ──────────────────────────────────────────────────────────

  const handleContinue = useCallback(() => {
    const save = loadSave();
    if (!save) return;
    loadGame(save);
    setSelectedMapId(save.mapId);
    setAppScreen('game');
  }, [loadGame]);

  const handleNewGame = useCallback(() => {
    clearSave();
    const mapId = gameConfig.unlockedMapIds.length === 1 ? 1 : null;
    setSelectedMapId(mapId);
    restartRun(mapId ?? 1);
    setSeedsAwarded(false);
    setPetalsAwarded(false);
    setAppScreen('game');
  }, [gameConfig.unlockedMapIds.length, restartRun]);

  const handleResetAllData = useCallback(() => {
    if (!showResetConfirm) { setShowResetConfirm(true); return; }
    localStorage.removeItem('garden_td_tech_tree');
    localStorage.removeItem('garden_td_prestige');
    localStorage.removeItem('garden_td_save');
    window.location.reload();
  }, [showResetConfirm]);

  // ─── Run-end reward flow ───────────────────────────────────────────────────

  const awardRunRewards = useCallback(() => {
    if (!seedsAwarded) { addSeeds(state.seedsThisRun); setSeedsAwarded(true); }
    if (!petalsAwarded) { addPetals(state.petalsThisRun); setPetalsAwarded(true); }
  }, [seedsAwarded, petalsAwarded, state.seedsThisRun, state.petalsThisRun, addSeeds, addPetals]);

  const resetRunRewards = () => { setSeedsAwarded(false); setPetalsAwarded(false); };

  // ─── Screen routing ────────────────────────────────────────────────────────

  if (appScreen === 'menu') {
    return (
      <>
        <MainMenu
          hasSave={!!loadSave()}
          onContinue={handleContinue}
          onNewGame={handleNewGame}
          onHowTo={() => setAppScreen('how_to')}
          onSettings={() => { setShowResetConfirm(false); setAppScreen('settings'); }}
        />
        {appScreen === 'settings' && (
          <SettingsOverlay
            audioSettings={audioSettings}
            onUpdate={setAudioSettings}
            onResetData={handleResetAllData}
            onClose={() => setAppScreen('menu')}
          />
        )}
      </>
    );
  }

  if (appScreen === 'how_to') {
    return <HowToScreen onBack={() => setAppScreen('menu')} />;
  }

  if (appScreen === 'settings') {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <SettingsOverlay
          audioSettings={audioSettings}
          onUpdate={setAudioSettings}
          onResetData={handleResetAllData}
          onClose={() => setAppScreen('menu')}
        />
      </div>
    );
  }

  // ─── Game screen ───────────────────────────────────────────────────────────

  if (selectedMapId === null) {
    return (
      <MapSelectScreen
        unlockedMapIds={gameConfig.unlockedMapIds}
        onSelect={id => { setSelectedMapId(id); restartRun(id); }}
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

  const handleBackToMenu = () => {
    awardRunRewards();
    resetRunRewards();
    setAppScreen('menu');
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
    playSound('prestige');
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

  const handleUnlockNode = (nodeId: string) => {
    unlockNode(nodeId);
    playSound('unlock_node');
  };

  const handleUnlockPrestigeNode = (nodeId: string) => {
    unlockPrestigeNode(nodeId);
    playSound('unlock_node');
  };

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-4">
      <div className="relative flex flex-col" style={{ border: '2px solid #166534', borderRadius: 8 }}>
        <HUD
          state={state}
          totalPetals={prestigeState.petals}
          speed={speed}
          slowMotionUnlocked={prestigeConfig.slowMotionUnlocked}
          onSetSpeed={setSpeed}
          onPrestige={handlePrestigeClick}
        />

        <div className="relative">
          <GameBoard
            state={state}
            map={map}
            speed={speed}
            playSound={playSound}
            onTileClick={(col, row) => {
              if (state.selectedTowerType) {
                if (placeTower(col, row)) playSound('place_tower');
              } else selectTower(null);
            }}
            onTowerClick={id => selectTower(id)}
          />

          {selectedTower && (
            <TowerInfoModal
              tower={selectedTower}
              config={gameConfig}
              onSell={() => { sellTower(selectedTower.id); playSound('sell_tower'); }}
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
              onMenu={handleBackToMenu}
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

      <div className="mt-2 text-green-700 text-xs font-mono">v{__VERSION__}</div>

      <div className="mt-2 flex gap-4 items-center">
        <button onClick={() => setAppScreen('menu')} className="text-green-500 hover:text-green-200 text-sm underline">
          ☰ Menu
        </button>
        <button onClick={() => setShowTechTree(true)} className="text-green-400 hover:text-green-200 text-sm underline">
          🌱 Tech Tree ({techTree.seeds} seeds)
        </button>
        <button onClick={() => setPrestigeOverlayMode('browse')} className="text-pink-400 hover:text-pink-200 text-sm underline">
          🌸 Prestige Tree ({prestigeState.petals} petals)
        </button>
        {gameConfig.unlockedMapIds.length > 1 && (
          <button onClick={() => setSelectedMapId(null)} className="text-green-400 hover:text-green-200 text-sm underline">
            🗺️ Change Map
          </button>
        )}
      </div>

      {showTechTree && (
        <TechTreeOverlay
          techTree={techTree}
          techNodeCostMultiplier={prestigeConfig.techNodeCostMultiplier}
          onUnlock={handleUnlockNode}
          onClose={handleCloseTechTree}
        />
      )}

      {prestigeOverlayMode !== null && (
        <PrestigeOverlay
          mode={prestigeOverlayMode === 'browse' ? 'tree' : prestigeOverlayMode}
          isPostPrestige={prestigeOverlayMode === 'tree'}
          currentSeeds={techTree.seeds}
          petalsThisRun={petalsAwarded ? 0 : state.petalsThisRun}
          prestigeState={prestigeState}
          prestigeConfig={prestigeConfig}
          onConfirm={handlePrestigeConfirm}
          onCancel={() => setPrestigeOverlayMode(null)}
          onUnlockNode={handleUnlockPrestigeNode}
          onContinue={handlePrestigeContinue}
        />
      )}
    </div>
  );
}
