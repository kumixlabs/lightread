# LightRead

**Read. Edit. Preview. Nothing Else.**

A lightweight document reader & editor for Windows, macOS, and Linux. Think Windows Notepad, but better: open any document, read it nicely, edit it simply — with Markdown preview, a file explorer, tabs, and search. Built with Tauri 2, React, TypeScript, @kumix/ui, and Tailwind CSS.

## Features

### Viewing
- **Markdown preview** — GitHub-flavored: tables, task lists, highlighted code blocks, local images, anchor links. Raw HTML is stripped for safety.
- **Code viewer** — Shiki syntax highlighting (100+ languages, lazy-loaded), themes, line numbers, word wrap. Read-only by design.
- **Pretty JSON** — minified JSON is indented on display.
- **CSV/TSV tables** — sticky header, delimiter auto-detect.
- **Images / SVG / HTML** — zoomable images, sandboxed previews (no script execution).
- **Large files** — over 10 MB open truncated & read-only; over 100 MB refused.

### Editing
- **Notepad-style plain text** for `.md`, `.txt`, `.log`, `.ini`, `.env` and friends — a native textarea, no distractions, full native undo.
- **`Ctrl+S`** save (UTF-8), **`Ctrl+Shift+S`** Save As, dirty indicator (`•`) on tabs, unsaved-change prompts on close/exit.
- **Find & Replace** (`Ctrl+F` / `Ctrl+H`) with match case and replace-all.
- **External changes** — auto-reload when clean; Reload/Keep-mine banner when you have unsaved edits. Your input is never lost.

### Workspace
- **Explorer** — lazy file tree with filter; `.git`/`node_modules`/… ignored.
- **Tabs** — middle-click close, close others/all, cycle (`Ctrl+Tab`).
- **Quick open** (`Ctrl+P`), **project search** (`Ctrl+Shift+F`), breadcrumbs, recents.
- **Session restore** — last open tabs (paths only) reopen on launch.
- **Drag & drop** files and folders; **"Open with LightRead"** file associations (`.md`, `.txt`, `.log`) with single-instance forwarding.
- **Status bar** — word/char count, line/column, encoding, file size.

## Download

Grab the latest release for your platform from [GitHub Releases](https://github.com/kumixlabs/lightread/releases):

| Platform | Artifact |
| --- | --- |
| Windows | `*-setup.exe` (installer) or portable `.exe` (needs WebView2 Runtime) |
| macOS (Apple Silicon / Intel) | `*.dmg` |
| Linux | `*.AppImage` or `*.deb` |

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
