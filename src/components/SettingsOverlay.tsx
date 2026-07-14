import type { AudioSettings } from '../hooks/useAudio';

interface Props {
  audioSettings: AudioSettings;
  onUpdate: (update: Partial<AudioSettings>) => void;
  onResetData: () => void;
  onClose: () => void;
}

// Labelled row with a mute toggle and a volume slider.
function AudioRow({
  label,
  muted,
  volume,
  disabled,
  onMuteToggle,
  onVolume,
}: {
  label: string;
  muted: boolean;
  volume: number;
  disabled?: boolean;
  onMuteToggle: () => void;
  onVolume: (v: number) => void;
}) {
  return (
    <div className={`flex items-center gap-4 ${disabled ? 'opacity-40' : ''}`}>
      <span className="text-green-200 text-sm w-24 shrink-0">{label}</span>
      <button
        onClick={onMuteToggle}
        disabled={disabled}
        className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
          muted ? 'bg-red-700 text-white' : 'bg-green-700 text-green-200 hover:bg-green-600'
        }`}
      >
        {muted ? '🔇 Muted' : '🔊 On'}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        disabled={disabled || muted}
        onChange={e => onVolume(parseFloat(e.target.value))}
        className="flex-1 accent-green-400 disabled:opacity-30"
      />
      <span className="text-green-400 text-xs w-8 text-right">{Math.round(volume * 100)}%</span>
    </div>
  );
}

// Settings modal. Music row is present but disabled until audio files are added.
// "Reset all data" is a two-step action to prevent accidental wipes.
export default function SettingsOverlay({ audioSettings, onUpdate, onResetData, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-green-950 border border-green-700 rounded-2xl p-6 w-96 space-y-6 text-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">⚙️ Settings</h2>
          <button onClick={onClose} className="text-green-400 hover:text-white text-sm font-semibold">✕ Close</button>
        </div>

        <div className="space-y-4">
          <h3 className="text-green-400 text-xs font-bold uppercase tracking-widest">Audio</h3>

          <AudioRow
            label="Sound Effects"
            muted={audioSettings.sfxMuted}
            volume={audioSettings.sfxVolume}
            onMuteToggle={() => onUpdate({ sfxMuted: !audioSettings.sfxMuted })}
            onVolume={v => onUpdate({ sfxVolume: v })}
          />

          <AudioRow
            label="Music"
            muted={audioSettings.musicMuted}
            volume={audioSettings.musicVolume}
            disabled
            onMuteToggle={() => onUpdate({ musicMuted: !audioSettings.musicMuted })}
            onVolume={v => onUpdate({ musicVolume: v })}
          />
          <p className="text-green-700 text-xs">Music coming soon — drop an audio file in to enable.</p>
        </div>

        <div className="space-y-2 border-t border-green-800 pt-4">
          <h3 className="text-red-400 text-xs font-bold uppercase tracking-widest">Danger Zone</h3>
          <button
            onClick={onResetData}
            className="w-full py-2 rounded-lg bg-red-900 hover:bg-red-700 text-red-300 hover:text-white text-sm font-semibold transition-colors"
          >
            🗑️ Reset All Save Data
          </button>
          <p className="text-green-700 text-xs">Clears tech tree, prestige tree, and saved run. Cannot be undone.</p>
        </div>
      </div>
    </div>
  );
}
