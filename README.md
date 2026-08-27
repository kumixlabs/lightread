# LightRead

**Read. Edit. Preview. Nothing Else.**

A lightweight document reader & editor for Windows, macOS, and Linux. Think Windows Notepad, but better: open any document, read it nicely, edit it simply — with Markdown preview, a file explorer, tabs, and search. Built with Tauri 2, React, TypeScript, @kumix/ui, and Tailwind CSS.

## Features

### Viewing
- **Markdown preview** — GitHub-flavored: Shiki-highlighted code blocks, tables, task lists, local images via asset protocol, hover `#` anchor links, Outline / TOC panel with scroll-spy, collapsible YAML frontmatter. Raw HTML is stripped for safety.
- **Code viewer** — Shiki syntax highlighting (100+ languages, lazy-loaded), themes, line numbers, word wrap. Read-only by design.
- **Customizable typography** — font size (10–28 px) and line height (1.00–3.00) synced across preview, editor, and code viewers.
- **Searchable code themes** — Shiki color scheme selector with instant filter.
- **Edit anything text-based** — notepad-style editing for `.txt`, `.md`, code files (JSON/TS/etc.), HTML, SVG, and CSV source; `Ctrl+S` to save, dirty tabs marked.
- **Pretty JSON** — minified JSON is indented on display.
- **CSV/TSV tables** — sticky header, delimiter auto-detect.
- **Images / SVG / HTML** — zoomable images, sandboxed previews (no script execution).
- **Audio / video preview** — MP3, WAV, FLAC, M4A, MP4, WebM, MOV (+ MKV/AVI best-effort) play in-tab via native controls; clear error card when a codec is unsupported. Preview-only — no playlists, no library.
- **Large files** — over 10 MB open truncated & read-only; over 100 MB refused.

### Editing
- **Notepad-style plain text** for `.md`, `.txt`, `.log`, `.ini`, `.env` and friends — a native textarea, no distractions, full native undo.
- **`Ctrl+S`** save (UTF-8), **`Ctrl+Shift+S`** Save As, dirty indicator (`•`) on tabs, unsaved-change prompts on close/exit.
- **Find & Replace** (`Ctrl+F` / `Ctrl+H`) with match case and replace-all.
- **External changes** — auto-reload when clean; Reload/Keep-mine banner when you have unsaved edits. Your input is never lost.

### Workspace
- **Explorer** — lazy file tree with filter; `.git`/`node_modules`/… ignored.
- **Live tree** — external deletes/renames/creates show up automatically, no refresh needed.
- **Create / rename / delete** — right-click in the sidebar: New File, New Folder, Rename (inline), Move to trash (recoverable via OS trash).
- **Tabs** — middle-click close, close others/all, cycle (`Ctrl+Tab`).
- **Quick open** (`Ctrl+P`), **project search** (`Ctrl+Shift+F`), breadcrumbs, recents.
- **Session restore** — last open tabs (paths only) reopen on launch.
### Platform & System
- **Auto-updater** — built-in update checker & installer in Settings backed by GitHub Releases and cryptographic signatures.
- **Drag & drop** — drop files or folders directly into the window to open.
- **Single-instance & associations** — "Open with LightRead" file associations (`.md`, `.txt`, `.log`).
- **Status bar** — word/char count, line/column, encoding, file size.
- **Settings reset** — one-click "Reset to defaults".

## Download

Grab the latest release for your platform from [GitHub Releases](https://github.com/kumixlabs/lightread/releases):

| Platform | Artifact |
| --- | --- |
| Windows | `*-setup.exe` (installer) or portable `.exe` (needs WebView2 Runtime) |
| macOS (Apple Silicon / Intel) | `*.dmg` |
| Linux | `*.AppImage` or `*.deb` |

> **Linux audio/video preview**: relies on system GStreamer codecs. If MP3/MP4 fails to play, install them once:
> `sudo apt install gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-libav`
> (Windows and macOS use OS codecs — nothing to install.)

> macOS builds are ad-hoc signed: on first launch, right-click the app → **Open**.

## Development

```bash
bun install          # install deps
bun run build        # frontend build (tsc + vite)
cargo check          # rust typecheck (in src-tauri/)
bun tauri dev        # full dev launch
bun tauri build      # production build
```

## License

MIT
