# Build commands
- `bun install` — install deps
- `bun run build` — frontend build (tsc + vite)
- `cargo check` — rust typecheck (run in src-tauri/)
- `bun tauri dev` — full dev launch
- `bun tauri build` — production build

# Architecture
- Product: LightRead — docs reader/editor (PRD: LightRead-PRD.md). Version source of truth: `package.json` (keep `src-tauri/tauri.conf.json` + `src-tauri/Cargo.toml` in sync on release).
- State: zustand store at src/stores/app-store.ts (persisted: settings, recents, session tab paths)
- File type detection: src/lib/file-types/registry.ts
- Tauri API wrapper: src/lib/tauri-api.ts
- Rust commands: src-tauri/src/{filesystem,watchers,search}.rs (read/write text, directory listing, create/rename/trash, file watchers incl. recursive workspace watch, project search)
- Viewers dispatched by viewerType in src/components/viewers/viewer-router.tsx
- File tree: custom recursive components in src/components/explorer/ (lazy children per folder, inline create/rename inputs, context menus, motion animations). Do NOT swap for declarative tree components — they can't host the inline-edit rows or per-node menus.
- Watcher echo suppression: on WSL/drvfs, READING a directory emits watcher events. `markTreeRead()` + `treeEventGuard` (src/stores/app-store.ts) suppress echoes after every programmatic read; `selfWrites` suppresses own-save events. Keep stamping after any new tree-reading code path.
- Editing: plain textarea surface for `text`, `markdown` source, and the Edit mode of `code`/`html`/`svg`/`csv` source. Highlighted view stays read-only; editing surface is always plain textarea.
- Release CI: .github/workflows/release.yml (Windows/macOS/Linux matrix; draft release on `v*` tags)

# Key rules
- Editing is plain-text only (notepad-style). No WYSIWYG, no Monaco/CodeMirror/TipTap.
- All text-based files are editable via plain-text Edit mode (no rich editing surface). Highlighting is view-only.
- Never execute user files. No terminal (removed).
- Markdown preview must strip raw HTML (no rehype-raw). HTML/SVG previews only in `sandbox=""` iframes via srcDoc.
- Writes only via Rust commands (`write_text_file`, `create_file`, `create_dir`, `rename_path`). No fs plugin. Delete goes to OS trash via `delete_path` (recoverable, never permanent).
- Never lose user input: save errors keep dirty state; external-change conflicts prompt, never silently overwrite.
- Keep Tauri permissions minimal (see src-tauri/capabilities/default.json).
- Highlighting: shared Shiki instance at src/lib/shiki.ts (lazy lang loading, GitHub themes). Used across code viewer and markdown preview code blocks.
- Media: images via Tauri asset protocol (`security.assetProtocol.enable: true`). Audio/video playback via native `<video>`/`<audio>` tags through the same asset protocol (no third-party player deps).
