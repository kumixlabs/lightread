# Build commands
- `bun install` — install deps
- `bun run build` — frontend build (tsc + vite)
- `cargo check` — rust typecheck (run in src-tauri/)
- `bun tauri dev` — full dev launch
- `bun tauri build` — production build

# Architecture
- Product: LightRead 0.1.0 (docs reader/editor, PRD: LightRead-PRD.md).
- State: zustand store at src/stores/app-store.ts (persisted: settings, recents, session tab paths)
- File type detection: src/lib/file-types/registry.ts
- Tauri API wrapper: src/lib/tauri-api.ts
- Rust commands: src-tauri/src/{filesystem,watchers,search}.rs (read/write text, directory listing, file watchers, project search)
- Viewers dispatched by viewerType in src/components/viewers/viewer-router.tsx
- Editing: plain textarea surface for `text`, `markdown` source, and the Edit mode of `code`/`html`/`svg`/`csv` source. Highlighted view stays read-only; editing surface is always plain textarea.
- Release CI: .github/workflows/release.yml (Windows/macOS/Linux matrix; draft release on `v*` tags)

# Key rules
- Editing is plain-text only (notepad-style). No WYSIWYG, no Monaco/CodeMirror/TipTap.
- All text-based files are editable via plain-text Edit mode (no rich editing surface). Highlighting is view-only.
- Never execute user files. No terminal (removed).
- Markdown preview must strip raw HTML (no rehype-raw). HTML/SVG previews only in `sandbox=""` iframes via srcDoc.
- Writes only via Rust `write_text_file`. No fs plugin, no delete/rename.
- Never lose user input: save errors keep dirty state; external-change conflicts prompt, never silently overwrite.
- Keep Tauri permissions minimal (see src-tauri/capabilities/default.json).
- Highlighting: shared Shiki instance at src/lib/shiki.ts (lazy lang loading, GitHub themes). Used across code viewer and markdown preview code blocks.
- Media: images via Tauri asset protocol (`security.assetProtocol.enable: true`). No audio/video playback.
