# Changelog

All notable changes to LightRead will be documented in this file.

## 0.1.0

Initial release.

### Core

- Read. Edit. Preview. Nothing Else — a lightweight document reader & editor (Tauri 2 + React + TypeScript).
- Windows first; macOS & Linux builds shipped via GitHub Releases (NSIS installer + portable exe, DMG, AppImage + deb).

### Viewing

- Markdown preview (GitHub-flavored): tables, task lists, highlighted code blocks, blockquotes, local images, in-document anchor links. Raw HTML is stripped.
- Source ⇄ Preview toggle per tab (`Ctrl+Shift+V`); default mode configurable.
- Code viewer with Shiki syntax highlighting (24 core languages at startup, 100+ lazy on demand), themes, line numbers, word wrap, copy button.
- Minified JSON under 2 MB pretty-printed on display.
- `.csv` / `.tsv` table view with sticky header and delimiter auto-detection.
- Image viewer (zoom, fit, transparency checkerboard), SVG preview (sandboxed), HTML preview (sandboxed iframe, no scripts).
- Unsupported/binary files: metadata + open-in-default-app action.
- Large-file safety: text files over 10 MB open truncated & read-only; over 100 MB refused.

### Editing

- Notepad-style plain-text editing for `.md`, `.txt`, `.log`, `.ini`, `.env` and friends — native textarea, no distractions.
- `Ctrl+S` save (UTF-8) via Rust command; dirty indicator (`•`) on tabs.
- `Ctrl+Shift+S` Save As via OS dialog.
- Find & Replace (`Ctrl+F` / `Ctrl+H`): match case, replace, replace all; disabled in read-only surfaces.
- Unsaved-changes prompts on tab close and app exit (Save / Don't Save / Cancel) — user input is never lost.
- External file changes: auto-reload when clean; Reload/Keep-mine banner when dirty.

### Workspace

- Folder explorer with lazy tree, filter, ignored dirs (`.git`, `node_modules`, …).
- Tabs (middle-click close, close others/all), quick open (`Ctrl+P`), project-wide search (`Ctrl+Shift+F`, Rust-side, capped results).
- Breadcrumbs, recents, session restore (reopens last tabs, never unsaved drafts).
- Drag & drop files and folders; file associations for `.md`/`.markdown`/`.txt`/`.log` with single-instance forwarding ("Open with LightRead").

### Platform

- Status bar: word/char count, line/column, encoding (UTF-8 / lossy), file size.
- Light/dark/system themes, font size, word wrap, line numbers, Markdown default mode settings.
- Full keyboard shortcut set (`Ctrl+O`, `Ctrl+Shift+O`, `Ctrl+B`, `Ctrl+=/-/0`, `F11`, …).
- Explicit CSP, sandboxed previews, minimal Tauri permissions; all file I/O via scoped Rust commands.
- Release logging to rotating file; no network, no telemetry.
