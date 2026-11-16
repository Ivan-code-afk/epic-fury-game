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
  objective: { type: 'reach' },      // reach | defend (waves) | launchers (time; add special: 'himars', strikes: 3) | boss | demolish (escape: seconds) | search (minCol: bomb crate is picked right of this column) | rescue (min: hostages that must survive; mission field `chopper: true` draws a helicopter at the exit)
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

All uppercase letters are taken, so newer objects use lowercase: `h` hostage, `j` cell bars, `g` guard dog, `l` searchlight tower.

Extra level fields: `lifts: [[column, topRow, bottomRow]]`, `lamps: [[column, row]]`, `door: [[column, row]]` (tiles removed when C4 is planted), `backdrops: [[colFrom, colTo, rowFrom, rowTo]]` (interior back walls). Mission field `dark: 0.86` turns on darkness with a flashlight.

While jumping, hold DOWN to shoot straight down.

## Custom art
All sprites live in `G.SPR` (`src/sprites.js`). To replace one, load an `Image` and assign it to the same key,
e.g. `G.SPR.president[0] = myImage`. Frame sizes are noted in the code.

## Status
Missions 1–10 are playable. The rest show as "COMING SOON" in the menu.
