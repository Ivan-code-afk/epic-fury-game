# Operation Epic Fury

A satirical 90s-style run-and-gun platformer (think Contra / Metal Slug). Plain HTML5 + JavaScript: no dependencies, no build step.
All characters are fictional.

## Running
Open `index.html` in a browser. It also works on GitHub Pages (Settings → Pages → `main` branch).

## Controls
| Action | Keyboard | Touch |
|---|---|---|
| Run | ← → / A D | ◀ ▶ |
| Aim up / crouch | ↑ ↓ / W S | ▲ ▼ |
| Jump | X / K / Space | A |
| Fire | Z / J | B |
| Grenade | C / L | G |
| Thermal vision / call HIMARS | V / I | V |
| Pause | Enter / Esc | II |
| Sound | M | — |

Down + jump drops through a platform.

## Game loop
Title → main menu: **Continue**, **New Game**, **Mission Select**, Difficulty, Sound, How to Play, Fullscreen, **Reset Progress** (with confirmation).
Missions unlock one by one. After each mission: a results screen (score, time, kills, deaths, hits taken, rank S/A/B/C) with Next / Replay / Mission Select / Main Menu. Pause menu: Resume, Restart, Sound, Mission Select, Main Menu. Dialogue can be skipped (Esc / C / SKIP). After the finale: credits.
Progress, best scores, ranks, difficulty and sound are saved in the browser.

**For testers:** open the game with `#unlockall` at the end of the address (e.g. `https://ivan-code-afk.github.io/epic-fury-game/#unlockall`) to unlock every mission without touching saved progress.

## Difficulty
Pick EASY / NORMAL / HARD with ◀ ▶ on the mission select screen (tap the line on phones). The choice is saved.

| | Easy | Normal | Hard |
|---|---|---|---|
| Hearts | 7 | 5 | 4 |
| Lives | 5 | 3 | 2 |
| Enemy fire rate | ×0.65 | ×1 | ×1.35 |
| Enemy health | ×0.8 | ×1 | ×1.3 |
| Mission timers | ×1.3 | ×1 | ×0.8 |

Each mission also has its own `heat` (enemy fire-rate multiplier) so the campaign ramps up; partner missions use `allyPower` to keep partners from carrying the player. Values live in `src/config.js` and `src/missions.js`.

### Balance bot
`tools/bot.js` + `tools/balance.py` play every mission with a scripted bot and report hits taken per screen, where it got hit most, and how far it got. `tools/bossbal.py` does the same for the two boss fights. Requires Python Playwright and Chrome:
```
python3 tools/balance.py 3 normal     # 3 runs per mission
python3 tools/bossbal.py hard
```

## Project layout
```
index.html        — canvas and touch buttons
src/config.js     — character names, weapons, physics
src/input.js      — keyboard and touch
src/audio.js      — synthesized sound effects and chiptune
src/sprites.js    — procedural pixel art (swap in PNGs)
src/level.js      — tiles, compact map format, backgrounds
src/entities.js   — player, AI partner, enemies, projectiles, pickups
src/dialog.js     — radio dialogue with portraits, speech bubbles
src/missions.js   — campaign: maps, objectives, dialogue
src/game.js       — main loop, game states, HUD
```

## Adding a mission
Add an object to `G.MISSIONS` in `src/missions.js`:

```js
{
  id: 'my', title: 'TITLE', subtitle: 'Description', theme: 'desert', // desert | gulf | city | night
  playable: true,
  ally: null,                        // 'president' | 'mossad' | null
  objective: { type: 'reach' },      // reach | defend (waves) | launchers (time; add special: 'himars', strikes: 3) | boss | demolish (escape: seconds) | search (minCol: bomb crate is picked right of this column) | rescue (min: hostages that must survive; mission field `chopper: true` draws a helicopter at the exit) | flight (speed: auto-scroll px/s; the player flies the LUCAS drone: Z gun, C bombs, V final dive)
  level: {
    ground: '#',                     // # sand, r rock, c concrete, d ship deck
    // theme can also be 'tunnel' or 'lab'
    terrain: '3333344445555___3333', // ground height per column; _ water; space = pit
    platforms: [[column, row, length]],
    blocks: [[column, row, 'b' | 'x']],
    objects: 'P2 S10 T14 H8:5 E19',  // letter + column[:row]
  },
  intro: [['hq', 'Text'], ['president', 'Text', 'happy']],
  triggers: [{ col: 10, radio: ['president', 'Radio line'] }],
  outro: [['president', 'Victory!', 'happy']],
}
```

Objects: `P` player, `A` partner, `S` soldier, `T` machine-gunner, `L` launcher truck, `K` civilian truck,
`X` base, `E` exit flag, `H` medkit, `M` M249, `N` Stinger, `G` grenades, `Y` Tie of Fury,
`B` speedboat (place over water), `O` jumping sea mine (over water), `D` drone (wakes up when the player is near), `Z` tollbooth boss,
`U` armored open launcher, `Q` RPG gunner, `R` radio (+2 HIMARS strikes),
`V` missile rail cart, `J` missile depot (touch to plant C4),
`C` PEACEFUL ATOM crate (one random crate holds the bomb), `F` centrifuge (leaks gas when shot), `W` timed laser barrier, `I` scientist (civilian, ducks when you fire toward him).

All uppercase letters are taken, so newer objects use lowercase: `h` hostage, `j` cell bars, `g` guard dog, `l` searchlight tower, `a` anti-aircraft gun, `s` SAM site (homing missiles you can shoot down), `f` drone factory (dive target), `n` cardboard cutout (harmless decoy).

`ally` can be one partner or a list, e.g. `ally: ['president', 'mossad']` with `allyBarks: { president: [...], mossad: [...] }`. Boss missions pick the boss with `objective.boss` ('broadcast' for the finale; default is the tollbooth), and `bossReveal: true` leaves the finale's surprise on stage.

Extra level fields: `lifts: [[column, topRow, bottomRow]]`, `lamps: [[column, row]]`, `door: [[column, row]]` (tiles removed when C4 is planted), `backdrops: [[colFrom, colTo, rowFrom, rowTo]]` (interior back walls). Mission field `dark: 0.86` turns on darkness with a flashlight.

While jumping, hold DOWN to shoot straight down.

## Custom art
All sprites live in `G.SPR` (`src/sprites.js`). To replace one, load an `Image` and assign it to the same key,
e.g. `G.SPR.president[0] = myImage`. Frame sizes are noted in the code.

## Status
All 12 missions are playable.
