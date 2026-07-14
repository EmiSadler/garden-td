interface Props {
  onBack: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-green-300 font-bold text-sm uppercase tracking-widest">{title}</h2>
      <div className="text-green-100 text-sm space-y-1">{children}</div>
    </div>
  );
}

// Full-screen how-to-play guide. Covers the core loop, all base towers, and the
// seeds/prestige meta-progression system.
export default function HowToScreen({ onBack }: Props) {
  return (
    <div className="min-h-screen bg-green-950 text-white overflow-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-8">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📖 How To Play</h1>
          <button
            onClick={onBack}
            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            ← Back
          </button>
        </div>

        <Section title="The Basics">
          <p>Place towers on the <strong className="text-green-300">green grass tiles</strong> to stop waves of garden pests from reaching your garden heart 🌷.</p>
          <p>Each pest that gets through costs you a <strong className="text-red-400">life ❤️</strong>. Lose all your lives and the run is over.</p>
          <p>Between waves you earn gold from kills. Spend it on more towers to build up your defences.</p>
        </Section>

        <Section title="Your Towers">
          <div className="grid grid-cols-1 gap-2">
            {[
              { e: '🌿', name: 'Thorn Bush',    desc: 'Solid single-target damage. Your bread and butter.' },
              { e: '🍯', name: 'Beehive',        desc: 'AoE damage — hits every enemy in range at once.' },
              { e: '🌻', name: 'Sunflower',      desc: 'No attacks. Drips gold over time to fund your build.' },
              { e: '💧', name: 'Sprinkler',      desc: 'Slows all enemies in range, giving your towers more time to fire.' },
              { e: '🌵', name: 'Cactus',         desc: 'High single-target damage with a crit chance (unlockable).' },
              { e: '🍄', name: 'Mushroom',       desc: 'Poisons enemies with damage-over-time. Unlock via tech tree.' },
              { e: '🪲', name: 'Venus Flytrap',  desc: 'Stuns enemies briefly. Unlock via tech tree.' },
              { e: '🌹', name: 'Rose',           desc: 'Reverses enemy direction temporarily. Unlock via tech tree.' },
              { e: '🚿', name: 'Watering Can',   desc: 'Chains slow to nearby enemies after hitting. Unlock via tech tree.' },
              { e: '🎃', name: 'Pumpkin',        desc: 'AoE burst on kill. Unlock via tech tree.' },
              { e: '🌳', name: 'Oak Tree',       desc: 'Massive AoE range. Unlock via tech tree.' },
            ].map(t => (
              <div key={t.name} className="flex items-start gap-3 bg-green-900/50 rounded-lg px-3 py-2">
                <span className="text-2xl shrink-0">{t.e}</span>
                <div>
                  <span className="font-semibold text-white">{t.name}</span>
                  <span className="text-green-400"> — {t.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Enemies">
          <div className="grid grid-cols-2 gap-2">
            {[
              { e: '🐛', name: 'Caterpillar', desc: 'Slow, low HP. Early waves.' },
              { e: '🐞', name: 'Ladybug',     desc: 'Fast. Harder to stop.' },
              { e: '🐌', name: 'Snail',       desc: 'Tanky. Soaks up damage.' },
              { e: '🐌👑', name: 'Boss Snail', desc: 'Every 10 waves. Drops prestige petals 🌸.' },
            ].map(t => (
              <div key={t.name} className="flex items-start gap-2 bg-green-900/50 rounded-lg px-3 py-2">
                <span className="text-xl shrink-0">{t.e}</span>
                <div>
                  <span className="font-semibold text-white text-xs">{t.name}</span>
                  <p className="text-green-400 text-xs">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Seeds 🌱 & the Tech Tree">
          <p>Kill enemies to earn <strong className="text-green-300">seeds</strong>. Seeds carry across all runs and are spent in the <strong className="text-green-300">Tech Tree</strong> for permanent upgrades — stronger towers, cheaper costs, extra lives, and more.</p>
          <p>Nodes unlock sequentially within each branch. You must buy position 1 before position 2.</p>
        </Section>

        <Section title="Petals 🌸 & Prestige">
          <p>Kill <strong className="text-pink-300">Boss Snails</strong> (every 10th wave) to earn petals. Once you have any, the <strong className="text-pink-300">Prestige</strong> button appears.</p>
          <p>Prestiging <strong className="text-red-400">wipes your tech tree</strong> but unlocks permanent bonuses in the Prestige Tree — new maps, seed carry-over on future prestiges, cheaper towers, and legacy starting towers.</p>
        </Section>

        <Section title="Tips">
          <p>🏗️ Place towers near <strong className="text-green-300">corners</strong> of the path to cover two directions at once.</p>
          <p>🌻 Sunflowers near the start pay off quickly — consider replacing them with attack towers in later waves.</p>
          <p>⚡ Use 3× or 5× speed during easy early waves to get to the action faster.</p>
          <p>💰 Selling towers refunds <strong className="text-green-300">50%</strong> — don't be afraid to rearrange.</p>
        </Section>

        <div className="pb-6">
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl font-bold text-lg bg-green-700 hover:bg-green-600 text-white transition-all"
          >
            ← Back to Menu
          </button>
        </div>

      </div>
    </div>
  );
}
