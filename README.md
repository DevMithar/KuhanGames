# KuhanGames

Educational games designed for children with autism, focusing on sensory accommodations and learning through play.

## Games

- **Balloon Pop**: Tap balloons or type letters to pop them and learn pronunciation
- **SHAPES**: Tap shapes and hear their names after a short delay
- **Color Matching**: Sensory-based color matching game (coming soon)
- **Word Builder**: Drag and drop letters to form words (coming soon)

## Installation

1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Clone or download this project
3. Run `bun install` to install dependencies
4. Run `/Users/nbala/.bun/bin/bun run start` to launch the desktop app, or `bun run web` for the browser at http://localhost:3000

> **Note (macOS):** If `bun` is not on PATH in VS Code terminals, use the full path `/Users/nbala/.bun/bin/bun run start`.

## Usage

1. **Desktop App**: Run `bun run start` (or use the absolute Bun path above)
2. **Web App**: Run `bun run web`, then open http://localhost:3000 in any browser
3. **Mobile**: Access the web server URL on any phone/tablet — fully responsive
4. Click a game tile to start playing
5. Use the ⚙️ Settings button to adjust:
   - Volume, Speech Rate, Visual Intensity
   - Background Music (Twinkle Twinkle, BINGO, Old MacDonald, Row Your Boat, Wheels on the Bus, or None)

## Balloon Pop — Feature Details

| Feature | Detail |
|---|---|
| Balloon shape | SVG teardrop balloon with gradient, shine highlights, knot, and string |
| Font | Nunito 700/900 (Google Fonts) |
| Letters | No letter repeats more than twice per round; pool = alphabet × 2, shuffled, pick 10 |
| Case | Toggle Uppercase / Lowercase via checkbox |
| Object words | "A for Apple" mode; randomised or custom words per letter |
| Keyboard | Type a letter to pop the matching balloon (`data-letter` attribute matching) |
| Balloon pop effect | Confetti burst in letter-specific colour palette + random blast animation |
| Game start | Cheerful ascending arpeggio (C5→E5→G5→C6) |
| Game end | Big confetti rain + victory fanfare + "Good job! Well done, Kuhan!" TTS |
| Background music | Looping Web Audio nursery rhymes; selectable in-game and in Settings |
| Voice | Female voice priority (Samantha → Karen → Zira → Google US English Female, etc.) |
| Speech | Lowercase spoken letter, rate × 0.85 for clarity |
| Play Again button | Pulses (scale 1 → 1.18 → 1, every 0.8 s) so it's easy to spot and tap |

## Mobile / Responsive

- Balloon area height: `clamp(220px, 42vh, 420px)` — scales with viewport
- Landscape on small phones: area shrinks via `@media (orientation: landscape) and (max-height: 520px)`
- Balloons use **percentage-based positioning** (`data-xPct` / `data-yPct`) — reposition on every resize/orientation change via `window resize` listener
- **⛶ Full Screen** button inside the balloon area: expands play area to `100vw × 100dvh`; score shown as overlay; balloons reflow after expand
- **Mobile audio unlock**: one-time `touchstart/pointerdown/click` listener resumes any suspended `AudioContext` (iOS/Android autoplay policy fix); all three audio contexts (`startBgMusic`, `playStartMusic`, `playVictoryMusic`) call `.resume()` before scheduling notes

## Architecture

| File | Purpose |
|---|---|
| `main.js` | Electron main process — creates BrowserWindow |
| `index.html` | Shell HTML, CSS (Nunito font, responsive layout, settings panel) |
| `renderer.js` | All game logic, music engine, speech, balloon rendering, confetti |
| `server.js` | Express static server on port 3000 (for web/mobile access) |

### Key renderer.js functions

- `startBgMusic()` / `stopBgMusic()` / `scheduleBgLoop()` — looping Web Audio music engine
- `selectBgMusic(val)` — race-condition-safe music switcher
- `NURSERY_RHYMES` — dictionary of 5 songs (melody + bass, BPM, loop length)
- `getPreferredVoice()` — ranked female voice picker via Web Speech API
- `speakText()` — wrapper for all TTS utterances
- `speakLetter()` — speaks letter then object word with correct rate
- `createBalloon()` — SVG balloon with percentage positioning and `data-letter`
- `repositionBalloons()` — reflows all active balloons on resize
- `toggleBalloonFullscreen()` — toggles fullscreen play area
- `createConfettiBurst()` — per-balloon confetti at pop position
- `throwBigConfetti()` — 90-piece confetti rain on game end
- `playStartMusic()` / `playVictoryMusic()` — one-shot audio effects
- `_unlockAudio()` — mobile audio context unlock on first gesture

## Goals

This app aims to provide engaging educational content for children with autism, with accommodations for sensory sensitivities:
- Adjustable audio levels and speech rate
- Customisable visual stimulation
- Predictable, calming interfaces
- Positive reinforcement through games

## Contributing

Feel free to add more games or improve accessibility features!
