import { MAPS } from '../maps';

interface Props {
  unlockedMapIds: number[];
  onSelect: (mapId: number) => void;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  'Easiest': 'text-green-400',
  'Medium':  'text-yellow-400',
  'Hard':    'text-orange-400',
  'Hardest': 'text-red-400',
};

export default function MapSelectScreen({ unlockedMapIds, onSelect }: Props) {
  const availableMaps = MAPS.filter(m => unlockedMapIds.includes(m.id));

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-white mb-2">Choose Your Garden</h1>
      <p className="text-green-400 text-sm mb-8">Each map has different difficulty and rewards</p>

      <div className="grid grid-cols-1 gap-4 w-full max-w-xl">
        {availableMaps.map(map => (
          <button
            key={map.id}
            onClick={() => onSelect(map.id)}
            className="bg-green-800 hover:bg-green-700 border border-green-600 hover:border-green-400 rounded-xl p-5 text-left transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white">{map.name}</h2>
              <span className={`text-sm font-semibold ${DIFFICULTY_COLOR[map.difficulty] ?? 'text-white'}`}>
                {map.difficulty}
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <span className="text-green-300">🌱 {map.seedMultiplier}× seeds</span>
              <span className="text-pink-300">🌸 {map.petalMultiplier}× petals</span>
              {map.segments.some(s => s.nextSegmentIds.length > 1) && (
                <span className="text-yellow-300">⚡ Branching paths</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
