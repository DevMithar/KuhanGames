# KuhanGames

Educational games designed for children with autism, focusing on sensory accommodations and learning through play.

## Games

- **Balloon Pop**: Click balloons or type letters on keyboard to pop them and learn pronunciation
- **Color Matching**: Sensory-based color matching game (coming soon)
- **Word Builder**: Drag and drop letters to form words (coming soon)
- **SHAPES**: Tap shapes and hear their names after a short 2-second delay

## Installation

1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Clone or download this project
3. Run `bun install` to install dependencies
4. Run `bun run start` to launch the desktop app, or `bun run web` to run in browser at http://localhost:3000

## Usage

1. **Desktop App**: Run `bun run start` or use VS Code launch "Launch Electron"
2. **Web App**: Run `bun run web` or use VS Code launch "Launch Web Server", then open http://localhost:3000 in browser
3. **Mobile/Web**: The web version is fully responsive and works on iPhone, iPad, PC, and any device with a browser. Simply access the URL on your device.
4. Click on a game button to start playing
5. Use the Settings button to adjust accessibility options:
   - Volume: Controls speech volume
   - Speech Rate: Speed of letter pronunciation
   - Visual Intensity: Adjusts visual effects (future feature)

## Development

- Main process: `main.js`
- Renderer: `index.html` and `renderer.js`
- Built with Electron for cross-platform desktop app

## Goals

This app aims to provide engaging educational content for children with autism, with accommodations for sensory sensitivities including:
- Adjustable audio levels
- Customizable visual stimulation
- Predictable, calming interfaces
- Positive reinforcement through games

## Contributing

Feel free to add more games or improve accessibility features!