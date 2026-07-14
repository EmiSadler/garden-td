interface Props {
  hasSave: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  onHowTo: () => void;
  onSettings: () => void;
}

// Full-screen main menu shown on load and after a run ends (when returning to menu).
// "Continue" is disabled if no valid save exists in localStorage.
export default function MainMenu({ hasSave, onContinue, onNewGame, onHowTo, onSettings }: Props) {
  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center gap-3 p-6">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">🌷</div>
        <h1 className="text-5xl font-bold text-white tracking-tight">Garden TD</h1>
        <p className="text-green-400 mt-2 text-sm">Protect your garden from the bugs</p>
      </div>

      <div className="flex flex-col gap-3 w-64">
        <button
          onClick={onContinue}
          disabled={!hasSave}
          className={`py-3 rounded-xl font-bold text-lg transition-all ${
            hasSave
              ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg hover:shadow-green-400/30'
              : 'bg-green-900 text-green-700 cursor-not-allowed'
          }`}
        >
          ▶ Continue
        </button>

        <button
          onClick={onNewGame}
          className="py-3 rounded-xl font-bold text-lg bg-green-700 hover:bg-green-600 text-white transition-all shadow-lg"
        >
          🌱 Start New Game
        </button>

        <button
          onClick={onHowTo}
          className="py-3 rounded-xl font-bold text-lg bg-green-800 hover:bg-green-700 text-white transition-all"
        >
          📖 How To Play
        </button>

        <button
          onClick={onSettings}
          className="py-3 rounded-xl font-bold text-lg bg-green-800 hover:bg-green-700 text-white transition-all"
        >
          ⚙️ Settings
        </button>
      </div>

      <p className="text-green-700 text-xs font-mono mt-8">v{__VERSION__}</p>
    </div>
  );
}
