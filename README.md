# PodLingo

Learn languages through podcast captions with synchronized audio playback.

## Features

- **Synchronized Captions**: Upload timestamped scripts and audio files for real-time caption display
- **Vocabulary Tracking**: Click words to save them to your personal vocabulary library
- **Project History**: Save and reload your audio/script combinations
- **Script Search**: Search through captions and jump to specific timestamps
- **Dark/Light Mode**: Toggle between themes with customizable accent colors
- **Desktop App**: Native Windows/macOS/Linux app with auto-updates (built with Tauri)

## Script Format

PodLingo expects timestamped scripts in this format:

```
[00:00:00.000 - 00:00:05.500] First sentence of the transcript.
[00:00:05.500 - 00:00:10.000] Second sentence continues here.
```

## Development

### Web App

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Desktop App (Tauri)

```bash
# Install Rust (if not already installed)
# https://www.rust-lang.org/tools/install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Desktop**: Tauri v2
- **Storage**: IndexedDB (via idb)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `H` | Toggle history sidebar |
| `B` | Toggle vocabulary library |
| `F` | Toggle script search (when loaded) |
| `D` | Toggle dark/light mode |

## License

MIT
