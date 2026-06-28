import type { PrestigeTreeState, PrestigeConfig, PrestigeNode } from '../types';
import { PRESTIGE_NODES, canUnlockPrestigeNode } from '../gameConfig';

interface Props {
  mode: 'confirm' | 'tree';
  currentSeeds: number;
  petalsThisRun: number;
  prestigeState: PrestigeTreeState;
  prestigeConfig: PrestigeConfig;
  onConfirm: () => void;
  onCancel: () => void;
  onUnlockNode: (nodeId: string) => void;
  onContinue: () => void;
}

const CLUSTER_LABELS: Record<PrestigeNode['cluster'], string> = {
  maps:    '🗺️ Maps',
  seeds:   '🌱 Seed Savings',
  bonuses: '⚔️ Permanent Bonuses',
  legacy:  '🏆 Legacy Towers',
};

function ConfirmView({
  currentSeeds,
  petalsThisRun,
  prestigeState,
  prestigeConfig,
  onConfirm,
  onCancel,
}: Omit<Props, 'mode' | 'onUnlockNode' | 'onContinue'>) {
  const keptSeeds = Math.floor(currentSeeds * prestigeConfig.seedSavingsRate);
  const lostSeeds = currentSeeds - keptSeeds;
  const totalPetalsAfter = prestigeState.petals + petalsThisRun;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40">
      <div className="bg-green-950 border border-pink-700 rounded-2xl p-8 text-white text-center space-y-5 w-96">
        <h2 className="text-2xl font-bold text-pink-300">✨ Prestige?</h2>
        <p className="text-green-300 text-sm">Your tech tree will be wiped. Prestige bonuses are permanent.</p>

        <div className="space-y-2 text-sm bg-green-900 rounded-xl p-4 text-left">
          <div className="flex justify-between">
            <span className="text-red-400">Tech tree unlocks</span>
            <span className="font-bold text-red-300">Wiped ✗</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-400">Seeds lost</span>
            <span className="font-bold text-red-300">🌱 {lostSeeds}</span>
          </div>
          {keptSeeds > 0 && (
            <div className="flex justify-between">
              <span className="text-green-400">Seeds kept ({Math.round(prestigeConfig.seedSavingsRate * 100)}%)</span>
              <span className="font-bold text-green-300">🌱 {keptSeeds}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-green-700 pt-2 mt-2">
            <span className="text-pink-400">Petals after prestige</span>
            <span className="font-bold text-pink-300">🌸 {totalPetalsAfter}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-pink-700 hover:bg-pink-600 text-white font-bold py-2 rounded-lg transition-colors"
          >
            Prestige ✨
          </button>
        </div>
      </div>
    </div>
  );
}

function TreeView({
  prestigeState,
  onUnlockNode,
  onContinue,
}: Pick<Props, 'prestigeState' | 'onUnlockNode' | 'onContinue'>) {
  const clusters: PrestigeNode['cluster'][] = ['maps', 'seeds', 'bonuses', 'legacy'];

  return (
    <div className="fixed inset-0 bg-green-950 z-40 overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Prestige Tree</h1>
            <p className="text-pink-400 text-sm">Permanent upgrades — survive every prestige</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white font-bold text-lg">🌸 {prestigeState.petals} petals</span>
            <button
              onClick={onContinue}
              className="bg-pink-700 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {clusters.map(cluster => {
            const nodes = PRESTIGE_NODES.filter(n => n.cluster === cluster);
            return (
              <div key={cluster} className="space-y-3">
                <h2 className="text-sm font-bold text-pink-300 uppercase tracking-widest">
                  {CLUSTER_LABELS[cluster]}
                </h2>
                {nodes.map(node => {
                  const isUnlocked = prestigeState.unlocked.has(node.id);
                  const canBuy = !isUnlocked && canUnlockPrestigeNode(node.id, prestigeState.unlocked, prestigeState.petals);
                  const locked = !isUnlocked && !canBuy;

                  return (
                    <div
                      key={node.id}
                      onClick={() => canBuy && onUnlockNode(node.id)}
                      className={`rounded-xl border p-3 space-y-1 transition-all ${
                        isUnlocked
                          ? 'bg-pink-900 border-pink-700 opacity-80'
                          : canBuy
                            ? 'bg-green-900 border-pink-500 cursor-pointer hover:border-pink-300 hover:bg-green-800'
                            : 'bg-green-950 border-green-900 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">
                          {isUnlocked ? '✅ ' : locked ? '🔒 ' : ''}{node.name}
                        </span>
                        {!isUnlocked && (
                          <span className={`text-xs font-bold ${canBuy ? 'text-pink-300' : 'text-green-700'}`}>
                            🌸 {node.cost}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-green-300">{node.description}</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PrestigeOverlay(props: Props) {
  if (props.mode === 'confirm') {
    return (
      <ConfirmView
        currentSeeds={props.currentSeeds}
        petalsThisRun={props.petalsThisRun}
        prestigeState={props.prestigeState}
        prestigeConfig={props.prestigeConfig}
        onConfirm={props.onConfirm}
        onCancel={props.onCancel}
      />
    );
  }
  return (
    <TreeView
      prestigeState={props.prestigeState}
      onUnlockNode={props.onUnlockNode}
      onContinue={props.onContinue}
    />
  );
}
