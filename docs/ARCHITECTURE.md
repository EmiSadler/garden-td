# Garden TD — Architecture

A tower defence game built with React 18, TypeScript, Vite, and Tailwind CSS v4. No game engine — the loop runs via `requestAnimationFrame` and all state is plain TypeScript objects.

---

## Top-level files

| File | Purpose |
|---|---|
| `index.html` | Vite entry point, mounts `#root` |
| `vite.config.ts` | Vite + Vitest config; injects `__VERSION__` from `package.json` at build time |
| `tailwind.config.ts` | Tailwind v4 content paths (keyframes live in `index.css`, not here) |
| `package.json` | Dependencies and semver version (bump this to update the in-game version label) |

---

## `src/`

### Entry

**`main.tsx`** — Renders `<App />` into `#root`. Nothing else.

**`App.tsx`** — Root component and application orchestrator. Owns:
- All three hooks (`usePrestige`, `useTechTree`, `useGameState`) and computes `gameConfig` from their combined output
- Screen routing: `MapSelectScreen` when no map is selected, game board otherwise
- All overlay open/close state (`showTechTree`, `prestigeOverlayMode`)
- Run-end reward flow: awards seeds and petals exactly once per run via `seedsAwarded` / `petalsAwarded` guards
- Prestige flow: confirm → `addPetals` → `prestige` → `resetWithSeeds` → tree → map select
- Renders the version label (`v{__VERSION__}`) below the board

**`index.css`** — Global styles. Contains the Tailwind v4 `@import`, the `@theme` block registering all custom animation utilities, and all `@keyframes` definitions:
- `tower-pulse` — attack bounce for all towers
- `tower-crit` — golden flash for cactus crits
- `tower-income` — gentle pulse for sunflower income
- `aoe-ring` — expanding ring for AoE tower fires
- `death-pop` — enemy emoji scale-up on kill
- `float-gold` — `+Ng` text rising from kill position
- `life-flash` — red board overlay on enemy exit

---

### Core game logic

**`types.ts`** — All shared TypeScript interfaces. Key types:
- `TowerType`, `EnemyType`, `GamePhase` — string union enums
- `GridPos` — `{ col, row }` coordinate
- `PathSegment` — a linear tile array with links to next segments (enables branching paths)
- `MapDef` — full map definition including segments, multipliers, difficulty
- `Enemy` — runtime enemy state (position, hp, timers for slow/poison/stun/reverse)
- `PlacedTower` — runtime tower state including `fireCount` and `lastFireWasCrit` for animations
- `GameState` — the complete snapshot of one game frame
- `TowerStats` / `EnemyStats` — static stat definitions
- `GameConfig` — merged config consumed by the game loop (output of `computeGameConfig`)
- `TechNode` / `TechTreeState` — tech tree data and runtime state
- `PrestigeNode` / `PrestigeTreeState` / `PrestigeConfig` — prestige tree data and runtime state

**`constants.ts`** — All static data:
- `GRID_COLS` (20), `GRID_ROWS` (12), `TILE_SIZE` (48px), `WAVE_COUNTDOWN`, `SPAWN_INTERVAL`, `SELL_REFUND`
- `BASE_TOWER_STATS` — cost, damage, range, cooldown, AoE, income, slow, poison, stun, reverse for all 11 tower types
- `BASE_ENEMY_STATS` — hp, speed, gold reward for all 4 enemy types

**`gameConfig.ts`** — Configuration computation layer. Contains:
- `TECH_NODES` — the 18-node tech tree definition (3 branches: roots, species, garden)
- `PRESTIGE_NODES` — the 17-node prestige tree definition (4 clusters: maps, seeds, bonuses, legacy)
- `DEFAULT_PRESTIGE_CONFIG` — zero-bonus baseline
- `computePrestigeConfig(unlocked)` — derives `PrestigeConfig` bonuses from unlocked prestige node IDs
- `computeGameConfig(techUnlocked, prestigeConfig)` — merges tech tree and prestige bonuses into a single `GameConfig` that the game loop consumes
- `canUnlockNode(nodeId, unlocked)` — tech tree unlock eligibility (sequential position gate)
- `canUnlockPrestigeNode(nodeId, unlocked, petals)` — prestige unlock eligibility (AND/OR gate + cost)

**`gameLogic.ts`** — Pure game loop functions (no React, no side effects). All functions take state and return new state:
- `makeEnemy(type, entrySegmentId, hpMultiplier, speedMultiplier)` — enemy factory
- `makePlacedTower(type, col, row)` — tower factory; initialises `fireCount: 0`, `lastFireWasCrit: false`
- `findTarget(tower, enemies, range, map)` — single-target: returns the furthest-progressed enemy in range
- `findTargetsInRadius(col, row, radius, enemies, map)` — AoE: returns all enemies within radius
- `applyDamageToEnemy(enemy, damage)` — clamps hp to 0
- `tickTowerAttacks(state, dt, config, map)` — fires towers, applies damage/debuffs, increments `fireCount`
- `tickSunflowers(state, dt, config)` — pays gold income, increments sunflower `fireCount`
- `tickEnemyMovement(state, dt, map)` — moves enemies along segments, handles slow/stun/reverse, marks exiters
- `collectDeadEnemies(state, map, config)` — removes hp≤0 enemies, awards gold/seeds/petals
- `tickPrep / tickWaveCountdown` — phase transition helpers
- `tick(state, dt, config, map)` — main loop entry point; composes all sub-ticks in order

**`waveBuilder.ts`** — Wave generation:
- `buildWave(wave)` — returns an `EnemySpawn[]` timed sequence; composition shifts across 4 phases (caterpillars → ladybugs → snails → mixed); every 10th wave is a boss wave
- `calculateSeeds(wavesSurvived, enemiesKilled)` — seeds earned formula

---

### Map data

**`mapData.ts`** — Path geometry utilities:
- `getPathTiles(waypoints)` — expands waypoint pairs into step-by-step tile arrays
- `isTileOnPath(col, row, pathTiles)` — point-in-path check
- `PATH_WAYPOINTS` — Map 1 waypoints (kept for test compatibility)

**`maps.ts`** — Map definitions and runtime helpers:
- `MAP_1` through `MAP_4` — full `MapDef` objects with segments, difficulty, seed/petal multipliers
- `MAPS` — exported array of all maps
- `getMapById(id)` — lookup by id
- `getMapPathTileSet(map)` — returns `Set<"col,row">` of all path tiles (fast collision check)
- `getMapEntryTile / getMapExitTile` — first/last tile of the entry segment / terminal segment
- `getEnemyPixelPos(segmentId, segmentProgress, map, tileSize)` — interpolates pixel position for smooth enemy movement

---

### Hooks

**`hooks/useGameState.ts`** — Runs the game loop and owns all per-run mutable state:
- Holds `stateRef` (a `useRef<GameState>`) — game state lives outside React to avoid re-render overhead from the RAF loop
- Drives `requestAnimationFrame` loop; calls `tick()` each frame with the current speed multiplier applied to `dt`
- Exposes actions: `selectTowerType`, `placeTower`, `selectTower`, `sellTower`, `restartRun`, `setSpeed`
- Triggers a React re-render each frame via `setTick(n => n + 1)` so components read from `stateRef.current`

**`hooks/useTechTree.ts`** — Manages tech tree state persisted to `localStorage` (`garden_td_tech_tree`):
- Loads/saves seed balance and unlocked node IDs
- Exposes: `addSeeds`, `unlockNode` (validates cost with `techNodeCostMultiplier` applied), `resetWithSeeds` (used on prestige)

**`hooks/usePrestige.ts`** — Manages prestige state persisted to `localStorage` (`garden_td_prestige`):
- Loads/saves petal balance and unlocked prestige node IDs
- Exposes: `addPetals`, `unlockPrestigeNode`, `prestige(currentSeeds)` — returns seeds to keep based on `seedSavingsRate`

---

### Components

**`components/GameBoard.tsx`** — The game grid and all in-game visual effects:
- Renders the 20×12 tile grid via `GameTile`
- Renders enemy sprites via `EnemySprite`
- Hover range ring (static indigo circle on tower hover, yellow preview on placement hover)
- **AoE fire ring** — tracks `fireCount` changes on beehive/sprinkler/oak_tree via `useRef` diff; spawns expanding colored ring overlays (amber/blue/green)
- **Death pop** — tracks enemy disappearances via `prevEnemiesRef`; spawns emoji scale-fade at kill position
- **Floating gold** — `+Ng` text rising from kill position
- **Life flash** — red board overlay on enemy exit; key-remount driven (no timer needed)

**`components/GameTile.tsx`** — A single 48×48 grid cell:
- Background colour: path (amber), placeable (bright green on hover when tower selected), grass (dark green)
- Shows exit 🌷, entry ▶, or tower emoji
- Tower emoji span uses `key={tower.fireCount}` to re-trigger CSS animation on each fire; picks `animate-tower-pulse`, `animate-tower-crit`, or `animate-tower-income` based on tower type and `lastFireWasCrit`

**`components/EnemySprite.tsx`** — Absolutely-positioned enemy sprite:
- Interpolated pixel position via `getEnemyPixelPos`
- HP bar (green → amber → red based on hp%)
- Debuff indicators: 🧪 poison, 🧊 slow
- Boss snail renders larger with 👑

**`components/HUD.tsx`** — Top bar during gameplay:
- Lives ❤️, gold 💰, wave number, seeds 🌱, petals 🌸
- Speed controls (⅓×/1×/3×/5×; ⅓× hidden unless slow-motion prestige unlocked)
- Prestige button (shown when total petals ≥ 1)
- Phase label (prep countdown, wave countdown, "defend!")

**`components/TowerPanel.tsx`** — Bottom bar tower selector:
- One button per unlocked tower type, showing emoji, name, cost
- Greyed out and disabled when unaffordable
- Hover tooltip with full stat breakdown

**`components/TowerInfoModal.tsx`** — Overlay shown when a placed tower is selected:
- Full stat readout, cost, sell refund
- Sell button returns 50% of purchase cost

**`components/MapSelectScreen.tsx`** — Full-screen map picker shown before each run:
- Lists unlocked maps with name, difficulty, seed/petal multipliers, branching path indicator
- Only shown when multiple maps are unlocked or after prestige

**`components/TechTreeOverlay.tsx`** — Full-screen tech tree browser:
- 3 columns (Roots / Species / Garden), 6 nodes each
- Nodes unlock sequentially within a branch; cost shown with `techNodeCostMultiplier` applied
- Greyed out when locked or unaffordable

**`components/PrestigeOverlay.tsx`** — Two-mode overlay:
- `confirm` mode: shows what's lost (tech tree, seeds) vs kept (seed savings %, new petal total); Confirm/Cancel buttons
- `tree` mode: 4-cluster prestige node grid (Maps / Seed Savings / Permanent Bonuses / Legacy Towers); AND/OR gate prerequisites enforced; Continue button leads to map select

**`components/RunEndOverlay.tsx`** — End-of-run summary modal:
- Waves survived, enemies killed, seeds earned, petals earned (if any)
- Buttons: open Tech Tree, Play Again

---

### Tests (`src/__tests__/`)

| File | Covers |
|---|---|
| `gameConfig.test.ts` | `computeGameConfig` output for every tech node; `PrestigeConfig` type construction |
| `prestige.test.ts` | `computePrestigeConfig` for all 17 nodes; `canUnlockPrestigeNode` AND/OR gates; seed savings maths |
| `gameLogic.test.ts` | `collectDeadEnemies` petal drops; enemy movement edge cases |
| `waveBuilder.test.ts` | Wave composition across phases; boss wave at wave 10; seed formula |
| `mapData.test.ts` | `getPathTiles` expansion; `isTileOnPath` |
| `setup.ts` | Vitest jsdom setup (jest-dom matchers) |

---

## Data flow

```
localStorage
    │
    ├─ usePrestige ──► computePrestigeConfig ──┐
    │                                          ├─► computeGameConfig ──► GameConfig
    └─ useTechTree ─────────────────────────────┘
                                               │
                                               ▼
                                         useGameState
                                         (RAF loop → tick())
                                               │
                                               ▼
                                    GameState (stateRef)
                                               │
                              ┌────────────────┼─────────────────┐
                              ▼                ▼                  ▼
                          GameBoard           HUD            TowerPanel
                        (grid + effects)  (stats bar)     (tower buttons)
```

## Persistence

| Key | Contents |
|---|---|
| `garden_td_tech_tree` | `{ seeds: number, unlocked: string[] }` |
| `garden_td_prestige` | `{ petals: number, unlocked: string[] }` |

Both are written synchronously on every mutation. No server, no auth.
