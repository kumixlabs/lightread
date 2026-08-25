# Changelog

All notable changes to LightRead will be documented in this file.

## 0.1.8 - 25-08-2026

### Fixed

- **Save-failure data loss**: closing an unsaved tab whose save failed no longer drops the tab — close aborts, tab + draft stay open, error banner explains why.
- **Find scroll**: find-bar now scrolls the actual viewer scroll container (code viewer, text editor, markdown, csv) instead of a non-scrolling wrapper.
- **Markdown relative images**: `![](./img.png)` / `../` paths resolve against the markdown file's directory.
- **Quick Open depth**: searches the full project tree (depth ≤ 8, ignored dirs skipped) instead of only 2 levels.
- **Quick Open selection**: stale index after re-filtering no longer makes Enter a silent no-op.
- **Watcher orphans**: switching workspace folders restarts file watches for still-open tabs.
- **Replace gate**: find & replace now works for all text-based viewers (code, HTML/SVG source, CSV source), not just `.txt`/`.md`.
- **HTML/SVG mode persistence**: Preview/Source choice survives tab switches.
- **Asset scope race**: scope grant now awaits before file load.
- **Atomic save**: writes go to a temp file then rename — a crash mid-save never truncates the original.
- **Markdown URL safety**: default react-markdown URL sanitization restored (removes identity `urlTransform`).

### Removed

- Dead `TextViewer` component + unused `.prose-custom` CSS.

### Docs

- AGENTS.md: version reference now points to `package.json` as single source of truth.

## 0.1.7 - 25-08-2026

### Fixed

- Audio/video playback blocked by CSP: added `media-src` directive (asset protocol + blob) so MP3/MP4 play in the built-in preview player instead of failing with a codec error.
- Media error card now distinguishes codec-unsupported from load failures and offers "Open with default app" fallback.

## 0.1.6 - 25-08-2026

### Added

- Audio & video playback: MP3/WAV/FLAC/AAC/OGG/M4A and MP4/WebM/MOV (+MKV/AVI best-effort) open in a built-in player with native controls, autoplay, and a clear error card when a codec is unsupported.

## 0.1.5 - 25-08-2026

### Fixed

- Single instance CLI arg parsing: slice argv[0] (binary executable path) so subsequent files/folders passed while app is running open properly in existing window.
- Window focus on single-instance trigger: automatically unminimize, show, and focus LightRead window on external open requests.

## 0.1.4 - 25-08-2026

### Fixed

- Windows Explorer Context Menu registry root: changed `HKCR` to `SHCTX` (`Software\Classes\...`) and added `SHChangeNotify` reload trigger so "Open with LightRead" appears immediately in per-user installer setups.

## 0.1.3 - 25-08-2026

### Added

- Windows Explorer Context Menu: "Open with LightRead" on right-clicking any file, folder, or folder background (registered via NSIS installer hooks).
- Cold-start & single-instance CLI argument support: opening files/folders from Explorer starts LightRead directly with the target file or workspace directory.

### Fixed

- Images failing to load outside default scopes: dynamically grant asset-protocol scope on `openFile`/`openFolder` (user-authorized paths).
- Certain SVGs rendering 0x0 or invisible in preview: refined iframe SVG scaling rules to preserve viewBox aspect ratio while filling the viewport.

## 0.1.2 - 25-08-2026

### Added

- Edit mode for all text-based files: code (JSON/TS/etc.), HTML, SVG (source mode), and CSV/TSV (source mode) now offer a plain notepad-style editing surface with `Ctrl+S` save. Highlighted views remain read-only.
- Auto-publish releases (`releaseDraft: false`) and updater artifacts with the correct signing key.
- Bundle metadata: publisher "Kumix Labs", homepage kumix.io, copyright, category Productivity.

### Fixed

- Window close button did nothing: exit now uses `process.exit` (permission granted) instead of `window.destroy` (denied by capabilities).

## 0.1.1 - 25-08-2026

### Fixed

- Code viewer (JSON/TS/etc.) stuck loading forever in packaged builds: CSP now allows `'wasm-unsafe-eval'` so Shiki's oniguruma WASM can compile; viewer falls back to plain text if highlighting fails.
- Markdown code blocks unreadable in light mode: pre text forced to `--foreground` over the muted surface.
- Updater "Failed to check for updates": enabled `bundle.createUpdaterArtifacts` so CI produces `latest.json` + signatures.

## 0.1.0 - 24-08-2026

Initial release.

### Core

- Read. Edit. Preview. Nothing Else — a lightweight document reader & editor (Tauri 2 + React + TypeScript).
- Windows first; macOS & Linux builds shipped via GitHub Releases (NSIS installer + portable exe, DMG, AppImage + deb).

### Viewing

- Markdown preview (GitHub-flavored): Shiki syntax-highlighted code blocks (matching themes), tables, task lists, blockquotes, local images (via Tauri asset protocol), in-document anchor links with hover `#` copy, auto-generated table of contents / Outline panel with scroll-spy, collapsible YAML frontmatter panel. Raw HTML is stripped.
- Source ⇄ Preview toggle per tab (`Ctrl+Shift+V`); default mode configurable.
- Code viewer with Shiki syntax highlighting (24 core languages at startup, 100+ lazy on demand), themes, line numbers, word wrap, copy button.
- Configurable font size (10–28 px) and line height (1.00–3.00) applied across markdown preview, plain-text editor, and code viewers.
- Searchable code theme combobox with live filtering and label previews.
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

- Native window drag-and-drop support for opening files and folder workspaces with dropzone overlay.
- In-app auto-updater (Tauri v2 plugin + minisign signature verification) in Settings dialog with seamless download & relaunch.
- Settings "Reset to defaults" action.
- Status bar: word/char count, line/column, encoding (UTF-8 / lossy), file size.
- Light/dark/system themes, font size, word wrap, line numbers, Markdown default mode settings.
- Full keyboard shortcut set (`Ctrl+O`, `Ctrl+Shift+O`, `Ctrl+B`, `Ctrl+=/-/0`, `F11`, …).
- Explicit CSP, sandboxed previews, minimal Tauri permissions; all file I/O via scoped Rust commands.
- Release logging to rotating file; no telemetry.
