interface Props {
  wave: number;
  enemiesKilled: number;
  seedsEarned: number;
  petalsEarned: number;
  onOpenTechTree: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

// End-of-run summary modal, shown when the player's lives reach zero.
// Seeds and petals are awarded exactly once in App before this is shown.
// Petals section is hidden when no boss snails were killed this run.
export default function RunEndOverlay({ wave, enemiesKilled, seedsEarned, petalsEarned, onOpenTechTree, onRestart, onMenu }: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60">
      <div className="bg-green-950 border border-green-700 rounded-2xl p-8 text-white text-center space-y-4 w-80">
        <h2 className="text-2xl font-bold">🌷 Garden Fallen!</h2>
        <div className="text-green-300 text-sm space-y-1">
          <p>Waves survived: <strong className="text-white">{wave}</strong></p>
          <p>Bugs defeated: <strong className="text-white">{enemiesKilled}</strong></p>
        </div>
        <div className="bg-green-900 rounded-xl py-3 px-4">
          <p className="text-xs text-green-400 uppercase tracking-widest mb-1">Seeds earned</p>
          <p className="text-3xl font-bold">🌱 {seedsEarned}</p>
        </div>
        {petalsEarned > 0 && (
          <div className="bg-pink-950 border border-pink-800 rounded-xl py-2 px-4">
            <p className="text-xs text-pink-400 uppercase tracking-widest mb-1">Prestige Petals</p>
            <p className="text-2xl font-bold text-pink-300">🌸 {petalsEarned}</p>
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <button
              onClick={onOpenTechTree}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded-lg transition-colors"
            >
              Upgrade Tree
            </button>
            <button
              onClick={onRestart}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
          <button
            onClick={onMenu}
            className="w-full bg-green-900 hover:bg-green-800 text-green-400 font-semibold py-1.5 rounded-lg text-sm transition-colors"
          >
            ☰ Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
