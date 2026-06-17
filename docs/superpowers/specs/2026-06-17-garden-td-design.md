# Garden TD — Design Spec
**Date:** 2026-06-17

## Overview

A single-player browser tower defence game set in a garden under bug invasion. Players place plant-themed towers beside a fixed winding path to stop waves of insects. Runs are endless — waves escalate until all lives are lost. After each run, players spend earned Seeds on a permanent 3-branch tech tree that carries across all future runs, making each attempt stronger.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Vite + React + TypeScript |
| Styling | Tailwind CSS |
| Persistence | localStorage (tech tree state, high score) |
| Rendering | DOM + CSS grid (not canvas) |
| Hosting | Vercel / GitHub Pages |
| Backend | None — fully client-side |

Emoji serve as all tower and enemy graphics — no custom art required.

---

## Core Loop

1. Player starts a run with a small gold amount and an empty garden grid
2. A 10-second build phase allows tower placement before wave 1
3. Wave starts — bugs march the fixed path; towers auto-attack in range
4. Player earns gold from kills; can buy and place towers between waves (build phase only)
5. Any bug that reaches the path exit (🌷 garden heart) costs one life
6. Run ends when lives reach zero
7. Seeds are awarded: `waves_survived × floor(enemies_killed / 10)`
8. Player opens the tech tree, spends seeds on permanent upgrades
9. New run begins with those upgrades applied

---

## Starting Resources

| Resource | Base Value | Notes |
|---|---|---|
| Gold 💰 | 150 | Spent on towers during a run |
| Lives ❤️ | 3 | Lost when a bug reaches the garden heart |
| Seeds 🌱 | Carried over | Accumulated total from all previous runs |

Gold per kill: 🐛 1g · 🐞 1g · 🐌 3g · Boss 🐌 15g

---

## Map

- **Grid:** 20×12 tiles
- **Path:** Fixed S-curve winding from the left edge to the right edge, approximately 40 tiles long
- **Placeable tiles:** All non-path tiles are valid tower placement spots
- **Path exit:** The garden heart 🌷 sits at the far-right end of the path — losing it costs a life
- **Single map for MVP** — additional maps can be added later without architectural changes

---

## Wave Flow

- **Prep phase:** 10 seconds before wave 1 only — no enemies, focused placement time; subsequent waves start automatically after a 3-second countdown
- **Active phase:** Real-time — towers auto-attack, enemies march; towers can still be bought and placed during active waves
- **Scaling:** Each wave spawns ~20% more enemies than the last
- **Mix shifts:** Every 5 waves, the enemy type ratio changes (more fast/tanky enemies introduced)
- **Boss wave:** Every 10 waves — one oversized boss snail 🐌 with 10× health; surviving it rewards +1 life

---

## Towers

Five towers available from the start of the game. Additional towers are unlocked via the Species Branch of the tech tree.

| Tower | Emoji | Role | Base Cost |
|---|---|---|---|
| Thorn Bush | 🌿 | Single-target, fast attack speed, short range | 50g |
| Beehive | 🍯 | Area of effect damage, medium range | 100g |
| Sunflower | 🌻 | Passive gold income every few seconds, no attack | 75g |
| Sprinkler | 💧 | Slows all enemies in range, no damage | 80g |
| Cactus | 🌵 | High single-target damage, slow attack, long range | 125g |

**Selling:** Any tower can be sold for 50% of its purchase price at any time.

---

## Enemies

| Enemy | Emoji | Traits |
|---|---|---|
| Caterpillar | 🐛 | Baseline — moderate speed, low health |
| Ladybug | 🐞 | Fast — high speed, low health |
| Snail | 🐌 | Tank — very slow, very high health |
| Boss Snail | 🐌× | Every 10 waves — 10× health, drops bonus seeds on death |

---

## Meta-Currency: Seeds 🌱

- Earned at the end of each run: `waves_survived × floor(enemies_killed / 10)`
- Accumulated permanently — never lost or reset
- Spent on the tech tree between runs
- Tech tree upgrades are also permanent — once unlocked, always active

---

## Tech Tree

Three branches of 6 nodes each (18 nodes total). Nodes must be unlocked left-to-right within their branch. All upgrades are permanent across all future runs.

### 🌱 Roots Branch — Tower Upgrades

| # | Name | Effect | Cost |
|---|---|---|---|
| 1 | Sharp Thorns | Thorn Bush +25% damage | 5 🌱 |
| 2 | Bigger Hive | Beehive +30% range | 8 🌱 |
| 3 | Golden Petals | Sunflower +50% gold income | 8 🌱 |
| 4 | Longer Soak | Sprinkler slow duration +50% | 6 🌱 |
| 5 | Spine Shield | Cactus gains 20% crit chance | 10 🌱 |
| 6 | Root Network | All towers +10% damage | 20 🌱 |

### 🌸 Species Branch — Unlock New Towers

| # | Name | Tower Unlocked | Cost |
|---|---|---|---|
| 1 | Spore Cloud | Mushroom 🍄 — poisons enemies (damage over time) | 15 🌱 |
| 2 | Snap | Venus Flytrap 🪤 — briefly stuns one enemy | 15 🌱 |
| 3 | Hypnopetal | Rose 🌹 — briefly reverses nearest enemy direction | 20 🌱 |
| 4 | Chain Drip | Watering Can 🪣 — chain slow hitting up to 3 enemies | 20 🌱 |
| 5 | Last Bloom | Pumpkin 🎃 — explodes on death dealing AoE damage | 25 🌱 |
| 6 | Ancient Growth | Oak Tree 🌳 — massive AoE, ultra-slow attack, anchor tower | 30 🌱 |

### ☀️ Garden Branch — Run-Start Bonuses

| # | Name | Effect | Cost |
|---|---|---|---|
| 1 | Compost | Start each run with +30 gold | 5 🌱 |
| 2 | Tough Roots | Start each run with 1 extra life | 10 🌱 |
| 3 | Early Bloom | Build phase before wave 1 extended to 20 seconds | 8 🌱 |
| 4 | Fertile Soil | All towers cost 10% less | 12 🌱 |
| 5 | Morning Dew | Global +15% attack speed | 15 🌱 |
| 6 | Full Garden | Start with one free Thorn Bush pre-placed at path entry | 20 🌱 |

---

## UI Layout

### In-Run HUD
- **Top bar:** ❤️ lives · 💰 gold · Wave N · 🌱 seeds earned this run
- **Main area:** The 20×12 garden grid (path tiles styled as dirt, placeable tiles as grass)
- **Bottom panel:** Row of tower buttons showing emoji, name, and gold cost — greyed out if unaffordable
- **Tower placement:** Click a tower button to select it → click a valid grass tile to place
- **Tower info:** Click a placed tower to show its stats and a Sell button (refund 50%)
- **Prep phase indicator:** Countdown timer shown prominently during the 10-second prep phase before wave 1; 3-second countdown between subsequent waves

### Run End Overlay
- Shows waves survived, enemies killed, seeds earned this run
- Button to open the tech tree

### Tech Tree Overlay
- Full-screen panel, 3 columns (one per branch)
- Each node shows name, effect, seed cost, and locked/unlocked/affordable state
- Nodes light up when the previous node in the branch is unlocked and the player can afford them

---

## Out of Scope (MVP)

- Multiple maps
- Multiplayer / leaderboards
- Tower synergy bonuses
- Difficulty settings
- Sound effects / music
- Mobile-native touch controls (basic touch may work, not optimised)
- Save mid-run state (refreshing abandons the current run; tech tree is always saved)
