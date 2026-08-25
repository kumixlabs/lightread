# Contributing to LightRead

Thank you for your interest in contributing! LightRead is a lightweight document reader & editor — "Notepad + Markdown preview" — built with Tauri 2, React, TypeScript, @kumix/ui, and Tailwind CSS.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.4.0 or higher
- [Rust](https://rustup.rs) (stable toolchain)
- Platform dependencies for Tauri: see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)
  - **Windows**: Microsoft Visual Studio C++ Build Tools + WebView2
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`

### Setup

```bash
git clone https://github.com/kumixlabs/lightread.git
cd lightread
bun install
```

### Development

```bash
bun tauri dev        # full desktop app (hot reload)
bun run dev          # frontend only (vite)
```

### Checks

Run all of these before committing:

```bash
bun run lint         # biome check
bun run types:check  # tsc --noEmit
bun run build        # tsc -b && vite build
cargo check          # in src-tauri/
```

## Project Rules

Read [AGENTS.md](./AGENTS.md) for the full architecture notes. The non-negotiables:

1. **Plain-text editing only.** No WYSIWYG, no Monaco/CodeMirror/TipTap. Highlighted views are read-only; editing is always a plain textarea.
2. **Never execute user files.** No terminal, no eval. HTML/SVG previews only in `sandbox=""` iframes.
3. **Writes only via Rust `write_text_file`.** No fs plugin, no delete/rename.
4. **Never lose user input.** Save failures keep dirty state; external-change conflicts prompt, never silently overwrite.
5. **No new runtime dependency** unless stdlib/platform truly cannot do it.
6. **Scope**: reader/editor. No IDE features (LSP, git client, plugin marketplace). Media playback is preview-only.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add csv table viewer
fix: markdown preview image path resolution
docs: update PRD viewer table
```

## Releases (Maintainers Only)

Releases are automated via GitHub Actions (`.github/workflows/release.yml`):

1. Bump version in **all three files** (kept in sync): `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`. Update `CHANGELOG.md`.
2. Commit, tag `vX.Y.Z`, push. CI builds Windows (NSIS + portable), macOS (dmg x2), and Linux (AppImage + deb), signs updater artifacts, and publishes the GitHub Release.
3. Users on older versions get the update via the built-in auto-updater.

## Security

Report vulnerabilities privately as described in [SECURITY.md](./SECURITY.md). Do not open public issues for security problems.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
