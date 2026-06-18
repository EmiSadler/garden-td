# Garden TD — Prestige System & Multiple Maps Design Spec
**Date:** 2026-06-18

## Overview

Add a prestige system with a permanent free-form skill tree, four maps (two with branching enemy paths), and per-map difficulty/reward multipliers. Prestige resets the main tech tree but keeps prestige progress, creating a long-term loop: build up → prestige → new map options → rebuild stronger.

---

## Core Prestige Loop

1. Player earns **Prestige Petals 🌸** — one drops each time a boss snail dies
2. At any time, a **Prestige button** in the HUD lets the player sacrifice their current tech tree
3. Confirmation overlay shows: seeds lost, tech tree wiped, and what prestige petals can now unlock
4. On confirm: tech tree unlocks wiped, seeds reset to 0 (modified by Seed Savings nodes), prestige petals and prestige tree unlocks kept forever
5. Player is taken to the **Map Selection screen** to choose which map to play next
6. New run begins on the chosen map with the merged GameConfig (tech tree bonuses + prestige bonuses)

The Prestige button is visible in the HUD as soon as the player has ≥1 petal. It can be used mid-run.

---

## Maps

Four maps, selectable each run from the Map Selection screen. Map 1 is always available; Maps 2–4 unlock via the prestige tree.

| Map | Name | Path Style | Tiles | Difficulty | Seeds Multiplier | Petal Multiplier |
|---|---|---|---|---|---|---|
| 1 | Garden Path | S-curve | ~34 | Medium | 1× | 1× |
| 2 | The Gauntlet | Long winding, tight turns | ~55 | Easiest | 0.8× | 1× |
| 3 | The Crossroads | Entry → one fork → exit | ~50 | Hard | 1.7× | 1.25× |
| 4 | The Labyrinth | Two fork points, four routes | ~60 | Hardest | 2.5× | 1.5× |

Map 2 is the recovery map — easier and pays out less, ideal for rebuilding after prestige. Maps 3 and 4 are high-risk high-reward.

The Map Selection screen shows each map's name, difficulty label, and multipliers so players can make an informed choice. If only Map 1 is unlocked (first launch or no prestige yet), the map select screen is skipped and Map 1 starts immediately.

---

## Branching Path Architecture

The current system tracks enemy position as a single `progress` float along a flat tile array. This is replaced with a **segment-based** system.

### Segment model

A **segment** is a linear array of `GridPos` tiles. Segments connect to other segments at junctions. Enemies reaching the end of a segment randomly pick one of the available next segments to continue along. Segments with no successors lead to the exit (🌷).

```typescript
interface PathSegment {
  id: string;
  tiles: GridPos[];          // ordered list of tiles in this segment
  nextSegmentIds: string[];  // empty = exit
}

interface MapDef {
  id: number;
  name: string;
  seedMultiplier: number;
  petalMultiplier: number;
  segments: PathSegment[];
  entrySegmentId: string;
}
```

Maps 1 and 2 have a single segment (no branching). Map 3 has three segments (entry, left branch, right branch) plus an exit segment. Map 4 has multiple fork segments.

### Enemy routing

`Enemy` gains two new fields replacing the old `progress`:

```typescript
segmentId: string;       // which segment the enemy is currently on
segmentProgress: number; // 0 to segment.tiles.length-1 within that segment
```

When `segmentProgress` reaches `segment.tiles.length - 1`, the enemy picks a random `nextSegmentId` and resets `segmentProgress` to 0. If no next segments exist, the enemy has exited.

### Pixel position

`getEnemyPixelPos` is updated to accept a segment + progress pair and interpolate within that segment's tile array.

### Path tile set

Each map computes its own `Set<string>` of `"col,row"` keys from all its segments combined. Components receive this set via props rather than importing a module-level constant.

---

## Prestige Tree

Free-form web of 17 nodes. Each node specifies its prerequisites explicitly (unlike the main tech tree which is strictly left-to-right). Multiple prerequisites may be required; some nodes have alternative prerequisites (either A or B).

### Node definitions

**🗺️ Maps cluster**

| ID | Name | Effect | Cost | Requires |
|---|---|---|---|---|
| `unlock_map2` | New Lands | Unlock Map 2 — The Gauntlet | 3 🌸 | — |
| `unlock_map3` | The Crossroads | Unlock Map 3 | 6 🌸 | `unlock_map2` |
| `unlock_map4` | The Labyrinth | Unlock Map 4 | 10 🌸 | `unlock_map3` |

**🌱 Seed carry-over cluster**

| ID | Name | Effect | Cost | Requires |
|---|---|---|---|---|
| `seed_savings_1` | Seed Savings I | Keep 15% of seeds on prestige | 2 🌸 | — |
| `seed_savings_2` | Seed Savings II | Keep 30% of seeds on prestige | 4 🌸 | `seed_savings_1` |
| `seed_savings_3` | Seed Savings III | Keep 50% of seeds on prestige | 7 🌸 | `seed_savings_2` |

**⚔️ Permanent bonuses cluster**

| ID | Name | Effect | Cost | Requires |
|---|---|---|---|---|
| `iron_roots` | Iron Roots | +1 permanent starting life | 3 🌸 | — |
| `ancient_soil` | Ancient Soil | Tower costs 5% cheaper permanently | 3 🌸 | — |
| `veteran_gardener` | Veteran Gardener | Global +10% permanent damage | 4 🌸 | `ancient_soil` |
| `boss_bounty` | Boss Bounty | Bosses drop 2 petals instead of 1 | 5 🌸 | `unlock_map2` |
| `quick_study` | Quick Study | Tech tree nodes cost 10% fewer seeds | 4 🌸 | `seed_savings_1` |
| `master_bloomer` | Master Bloomer | +10s prep time permanently | 2 🌸 | — |

**🏆 Legacy towers cluster**

| ID | Name | Effect | Cost | Requires |
|---|---|---|---|---|
| `legacy_beehive` | Legacy Beehive | Start each run with a free 🍯 | 4 🌸 | `ancient_soil` |
| `legacy_sprinkler` | Legacy Sprinkler | Start each run with a free 💧 | 4 🌸 | `iron_roots` |
| `legacy_cactus` | Legacy Cactus | Start each run with a free 🌵 | 6 🌸 | `legacy_beehive` OR `legacy_sprinkler` |
| `grand_legacy` | Grand Legacy | Start with an additional free 🌿 | 8 🌸 | `legacy_cactus` |

### Unlock rules

A node is purchasable when:
1. The player has enough petals
2. The node is not already unlocked
3. All required prerequisite nodes are unlocked (OR rules: at least one of the listed prerequisites)

---

## Persistence

Three tiers of data in `localStorage`:

| Data | Persists across | Key |
|---|---|---|
| Prestige petals | Everything | `garden_td_prestige` |
| Prestige tree unlocks | Everything | `garden_td_prestige` |
| Main tech tree unlocks | Runs (resets on prestige) | `garden_td_tech_tree` |
| Seeds | Runs (partially resets on prestige via Seed Savings) | `garden_td_tech_tree` |

---

## Architecture Changes

### New files

- `src/maps.ts` — `MapDef` definitions for all four maps, `PathSegment` type
- `src/hooks/usePrestige.ts` — prestige petal count, prestige tree state, `prestige()` action, `computePrestigeConfig()`
- `src/components/MapSelectScreen.tsx` — run-start map selection UI
- `src/components/PrestigeOverlay.tsx` — prestige confirmation + prestige tree overlay (two views in one component)

### Modified files

- `src/types.ts` — add `segmentId`, `segmentProgress` to `Enemy`; remove `progress`; add `PrestigeNode`, `PrestigeConfig`, `PrestigeTreeState` interfaces; update `MapDef` and `GameState` (add `mapId`)
- `src/mapData.ts` — refactor `getEnemyPixelPos` to be segment-aware; remove module-level `PATH_TILES`/`PATH_TILE_SET` constants (replaced by per-map computed data)
- `src/gameLogic.ts` — update `makeEnemy` (use `segmentId`/`segmentProgress`), update `tickEnemyMovement` (segment transitions + random branching), update `findTarget`/`getEnemyGridPos` (segment-aware), update `calculateSeeds` (apply map multiplier)
- `src/gameConfig.ts` — `computeGameConfig` accepts prestige config and merges bonuses; `techNodeCostMultiplier` from `quick_study` applied here
- `src/hooks/useGameState.ts` — accept `mapId`, use map's path data
- `src/components/GameBoard.tsx` — receive map path set as prop
- `src/components/GameTile.tsx` — receive `isOnPath` boolean prop instead of calling module function
- `src/components/EnemySprite.tsx` — segment-aware pixel position
- `src/components/HUD.tsx` — add prestige button + petal count
- `src/App.tsx` — add `usePrestige` hook, map selection state, wire prestige flow

### GameConfig merging

`computeGameConfig(techTreeUnlocked, prestigeConfig)` produces a single merged config. The game loop never touches prestige data directly — it only sees the final config values. Prestige permanent bonuses stack additively with tech tree bonuses where they overlap (e.g. both add starting lives).

---

## Out of Scope

- Animated enemy routing at fork points (enemies just snap to the new segment)
- Per-enemy path display (map shows all possible paths, not per-enemy routes)
- More than 4 maps in this iteration
