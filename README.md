# Canyon Run — 3 missions, 12 rings, fuel + damage, pseudo-3D chase flight

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/indrairawan4503-cmd/best-flight-game-20261126-0057-entry/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/indrairawan4503-cmd/best-flight-game-20261126-0057-entry/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

A pseudo-3D chase-view flight game in the OutRun style: a little prop plane flies
down a winding dusk canyon — orange rock walls, a teal river below, a low sun —
threading glowing target rings on its way to a runway landing.

## Run it

```sh
# serve game/ and open it in a desktop browser
python3 -m http.server --directory game 8080
```

## What you fly

- **3 missions, one plane:** Ring Run (12 rings against the clock), Canyon Time
  Trial (fastest clean run, +150 near-miss bonuses for skimming the walls), and
  Rescue Drop (drop supplies on 3 lit pads — low, slow, and fuel matters).
- **Fuel + damage turn a sortie into decisions:** throttle burns fuel, wall
  scrapes and floor strikes damage the hull, and a flare onto the runway beats
  a flyover finish.
- **Full flight feel:** keyboard throttle (↑/↓), banking turns (←/→), pitch
  (W/S), mouse steering, pause, restart, and a WebAudio engine hum with ring,
  drop, crash and win cues (oscillator only, no audio files).
- **Lit instruments:** altitude and speed dials, a heading compass, fuel and
  hull gauges and a throttle bar in the bottom HUD — plus a timer, rings,
  drops and score.
- **Original art, drawn in code:** warm dusk canyon, mesas, rock spires, the
  prop plane with blinking nav lights. No external assets, no network requests.

## Controls

| Key | Action |
| --- | --- |
| ↑ / ↓ | Throttle up / down |
| ← / → | Bank & turn |
| W / S | Pitch up / down |
| Mouse | Steer |
| Space | Drop supplies (Rescue Drop) |
| 1 / 2 / 3 | Pick a mission |
| P | Pause · R restart · M mute |

## Play it

Open `game/index.html` in a desktop browser — it plays offline, no build step.
Deterministic screenshot scenes: `?shot=start|play|end&seed=1`.

## Bounty

Entered in [Make the best flight game](https://make.fun/bounty/best-flight-game-20261126-0057)
($500 total, top 50 paid). Built with plain Canvas 2D — no libraries.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8dxq9bq0&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
