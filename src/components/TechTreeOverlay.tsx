import type { TechTreeState } from '../types';
import { TECH_NODES, canUnlockNode } from '../gameConfig';

interface Props {
  techTree: TechTreeState;
  onUnlock: (nodeId: string) => void;
  onClose: () => void;
}

const BRANCH_LABELS: Record<string, string> = {
  roots:   '🌱 Roots — Tower Upgrades',
  species: '🌸 Species — New Towers',
  garden:  '☀️ Garden — Run Bonuses',
};

export default function TechTreeOverlay({ techTree, onUnlock, onClose }: Props) {
  const branches = ['roots', 'species', 'garden'] as const;

  return (
    <div className="fixed inset-0 bg-green-950 z-30 overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tech Tree</h1>
            <p className="text-green-400 text-sm">Permanent upgrades — carry across all runs</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white font-bold text-lg">🌱 {techTree.seeds} seeds</span>
            <button
              onClick={onClose}
              className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Back to Garden
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {branches.map(branch => {
            const nodes = TECH_NODES.filter(n => n.branch === branch).sort((a, b) => a.position - b.position);
            return (
              <div key={branch} className="space-y-3">
                <h2 className="text-sm font-bold text-green-300 uppercase tracking-widest">
                  {BRANCH_LABELS[branch]}
                </h2>
                {nodes.map(node => {
                  const isUnlocked = techTree.unlocked.has(node.id);
                  const canUnlock = !isUnlocked && canUnlockNode(node.id, techTree.unlocked);
                  const affordable = canUnlock && techTree.seeds >= node.cost;

                  return (
                    <div
                      key={node.id}
                      onClick={() => affordable && onUnlock(node.id)}
                      className={`rounded-xl border p-3 space-y-1 transition-all ${
                        isUnlocked
                          ? 'bg-green-800 border-green-600 opacity-80'
                          : affordable
                            ? 'bg-green-900 border-green-500 cursor-pointer hover:border-yellow-400 hover:bg-green-800'
                            : 'bg-green-950 border-green-900 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">
                          {isUnlocked ? '✅ ' : ''}{node.name}
                        </span>
                        {!isUnlocked && (
                          <span className={`text-xs font-bold ${affordable ? 'text-yellow-400' : 'text-green-600'}`}>
                            🌱 {node.cost}
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
