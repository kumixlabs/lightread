# LightRead — Product Requirements Document (PRD)

**Product:** LightRead\
**Tagline:** Read. Edit. Preview. Nothing Else.\
**Status:** Implementation complete — pre-release\
**Platforms:** Windows, macOS, Linux\
**Primary Audience:** Anyone who needs to open, read, and lightly edit
documents without launching a full code editor.

------------------------------------------------------------------------

# 1. Product Overview

## 1.1 Product Definition

LightRead is a lightweight desktop document app — think **Windows
Notepad, but better**:

-   Opens any common text-based file instantly.
-   Edits plain text like Notepad (simple, no distraction).
-   Renders Markdown as a formatted document, with a toggle between
    source and preview.
-   Opens folders with a file explorer, tabs, and search.

The core product philosophy is:

> **Open → Read → Edit → Save.**

LightRead is **not** a code editor. There is no autocomplete, no
IntelliSense, no language servers, no debugging, no terminal, no Git.

### VS Code

> Build and edit software.

### Notepad

> Edit plain text, nothing about structure.

### LightRead

> Open any document, read it nicely, edit it simply.

------------------------------------------------------------------------

# 2. Problem Statement

Typical situations:

-   Read and fix a typo in a `README.md`.
-   Take quick notes in a `.txt` file.
-   Skim a large `.log` file.
-   Read documentation with embedded Markdown formatting.
-   Tweak a config value in `.ini` / `.env` / `.json`.

Using VS Code for this is heavy. Using Notepad is bare — no Markdown
rendering, no folder view, no tabs, no encoding fallback.

LightRead reduces this to:

> **Open LightRead → open file/folder → read → edit → Ctrl+S.**

------------------------------------------------------------------------

# 3. Product Goals

## 3.1 Primary Goals

1.  Launch and open files near-instantly.
2.  Open individual files and folders/projects.
3.  Edit plain-text files the way Notepad does.
4.  Render Markdown as a readable document.
5.  Toggle Markdown between source (editable) and preview.
6.  Read-only syntax-highlighted viewing for code files.
7.  View images, SVG, and HTML safely.
8.  Tabs for multiple open files, with unsaved-change indicators.
9.  Quick open, file-tree filtering, find-in-file (with replace),
    search-in-project.
10. Save with `Ctrl+S`; ask before closing unsaved tabs.
11. Work fully offline, local-first.
12. Stay small, fast, simple.

## 3.2 Secondary Goals

1.  Drag-and-drop file/folder opening.
2.  Remember recent files and projects.
3.  Detect external file changes and offer reload.
4.  Customizable appearance (theme, font size, word wrap).
5.  Reasonable handling of large files.
6.  Architecture that makes new viewers/editors easy to add.

------------------------------------------------------------------------

# 4. Non-Goals

Explicitly outside the scope:

-   WYSIWYG Markdown editing.
-   Rich-text editing of any kind.
-   Autocomplete, IntelliSense, language servers.
-   Debugging.
-   Terminal / integrated shell.
-   Git client, diff viewer, merge tool.
-   Media library / playlists / playback controls beyond a preview
    player (in-tab preview playback exists and is the ceiling).
-   Build systems, package management.
-   Extension/plugin marketplace.
-   Cloud sync, accounts, authentication.
-   Collaborative editing.
-   AI assistant.
-   Executing user files.
-   Bulk file management (multi-rename, drag-move, copy/paste of files).
    LightRead offers single-item create/rename/trash as sidebar conveniences
    — not a file manager.

Editing is deliberately **plain text only**. If the user needs more,
they should open a real editor.

------------------------------------------------------------------------

# 5. Target Platform

## 5.1 Initial Release (0.1.0)

**All three desktop platforms** — Windows, macOS, Linux. Built via
GitHub Actions matrix (NSIS + portable exe, DMG per-arch, AppImage +
deb); file associations registered per platform.

## 5.2 Future Releases

-   macOS
-   Linux

No platform-specific complexity unless required for cross-platform
architecture.

------------------------------------------------------------------------

# 6. Technology Stack

### Desktop Runtime

-   Tauri 2.x
-   Rust

### Frontend

-   React
-   TypeScript

### UI

-   shadcn/ui-style components (@kumix/ui)
-   Tailwind CSS

### Package Manager

-   Bun

Use latest stable versions at implementation time.

------------------------------------------------------------------------

# 7. Core Product Principles

## 7.1 Documents First

The app is optimized for reading and lightly editing documents —
Markdown, text, notes, logs, configs. Code viewing exists, but code is
read-only: LightRead is not where software gets written.

## 7.2 Simple Editing

Editing must feel like Notepad:

-   A single plain-text editing surface per file.
-   No formatting toolbar, no modes, no panels.
-   `Ctrl+S` saves. That is the whole editing model.

## 7.3 Safe Markdown Preview

Markdown preview renders only in a **sanitized pipeline**. Raw HTML in
Markdown is stripped, never executed. External links open in the system
browser, never in-app.

## 7.4 Fast First

Cold start to first file visible must be near-instant. No blocking
startup work. Heavy highlighting engines load lazily.

## 7.5 Local First

No network. No telemetry. Files never leave the machine.

## 7.6 Familiar Navigation

Explorer + tabs + quick open, like users already know. Keyboard-first
where possible.

------------------------------------------------------------------------

# 8. Main User Workflows

## 8.1 Open a Single File

1.  Launch LightRead (or use "Open with LightRead" from the OS).
2.  `Ctrl+O` or drag a file onto the window.
3.  File opens in a tab; viewer/edit surface chosen automatically.

## 8.2 Open a Folder / Project

1.  `Ctrl+Shift+O` or drag a folder.
2.  Sidebar shows the file tree; tree expands lazily.
3.  Click files to open tabs. `Ctrl+P` quick-open, `Ctrl+Shift+F`
    project search.

## 8.3 Edit and Save a Document

1.  Open a `.md` / `.txt` / plain-text file.
2.  Type directly into the editing surface.
3.  Tab title gains a `•` unsaved indicator.
4.  `Ctrl+S` writes the file to disk; indicator clears.

## 8.4 Preview Markdown

1.  Open a `.md` file.
2.  Toolbar toggle: **Source** / **Preview** (also `Ctrl+Shift+V`).
3.  Source is editable; Preview is rendered read-only.
4.  Default mode is a setting.

## 8.5 Close an Unsaved Tab

1.  Close a tab with unsaved changes.
2.  Confirm dialog: **Save / Don't Save / Cancel**.
3.  Same prompt on app exit with unsaved tabs.

------------------------------------------------------------------------

# 9. Drag and Drop

### File Drop

Opens the file in a tab. If a folder is already open, only the tab
opens.

### Folder Drop

Replaces the current workspace, reloads the tree.

### Multiple Files

Opens each file in its own tab, activates the last.

------------------------------------------------------------------------

# 10. Application Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Toolbar: nav, breadcrumb, find, actions                      │
├───────────┬──────────────────────────────────────────────────┤
│ Sidebar   │ Tabs                                            │
│ Explorer  │ ┌────────────────────────────────────────────┐   │
│ (file     │ │ Active document                              │   │
│  tree,    │ │ - edit surface OR rendered preview           │   │
│  filter,  │ │ - or read-only viewer (code/image/svg/html)  │   │
│  recents) │ └────────────────────────────────────────────┘   │
├───────────┴──────────────────────────────────────────────────┤
│ Status bar: path, size, lines, words/chars, cursor, encoding │
└──────────────────────────────────────────────────────────────┘
```

-   Sidebar collapsible (`Ctrl+B`).
-   No bottom panel. No module switcher.

------------------------------------------------------------------------

# 11. Sidebar / File Explorer

## 11.1 Requirements

-   Collapsible tree, lazily loaded (depth-limited reads).
-   Directories sorted before files, alphabetical.
-   Filter box filters the tree by name.
-   Ignore well-known heavy directories (`.git`, `node_modules`,
    `target`, `dist`, etc.).
-   Recents section: recent files and folders with clear-all.
-   Single click opens file; directory icon toggles expansion.
-   Live tree: external deletes/renames/creates appear automatically
    (recursive workspace watch, debounced).
-   Context menu on the sidebar: New File / New Folder (inline name
    input), Rename (inline), Move to trash (OS trash, recoverable).
    Deleting an item with unsaved open tabs is blocked.

------------------------------------------------------------------------

# 12. File Type Registry

A single registry decides, per filename, the `viewerType`:

| viewerType    | Behavior                                  | Editable |
| ------------- | ----------------------------------------- | -------- |
| `markdown`    | Source (textarea) ↔ Preview (rendered)    | Yes      |
| `text`        | Plain textarea                            | Yes      |
| `code`        | Shiki-highlighted read-only view          | No       |
| `csv`         | Table view (read-only)                    | No       |
| `image`       | Image viewer (zoom/fit)                   | No       |
| `svg`         | Preview ↔ Source                          | No       |
| `media`       | Native `<audio>`/`<video>` preview player  | No       |
| `html`        | Sandboxed preview ↔ Source                | No       |
| `unsupported` | Message + open-with-default-app action    | No       |

Detection order:

1.  Exact-name map (Dockerfile, Makefile, dotfiles).
2.  Extension map.
3.  Fallbacks: known image ext → `image` viewer; known audio/video ext →
    `media` viewer; otherwise binary sniff → `unsupported`; else `text`.

**Editable set** = `markdown` + `text` (see §14).

------------------------------------------------------------------------

# 13. Supported File Types

## 13.1 Markdown (primary)

-   Extensions: `.md`, `.markdown`, `.mdx` (rendered as Markdown).
-   Source mode: plain-text editing, monospace.
-   Preview mode: GitHub-flavored Markdown — headings with hover `#`
    anchor copy, lists, tables with header borders, task lists, code
    blocks highlighted via Shiki, blockquotes, links, local images
    resolved via Tauri asset protocol, auto-generated Outline / TOC
    panel with scroll-spy (h2-h3, hidden when <3 headings), collapsible
    YAML frontmatter panel.
-   Relative links to other files open those files in-app.
-   External links open in system browser.
-   Anchors (`#section`) scroll within the preview.

## 13.2 Plain Text

-   `.txt`, `.log`, `.conf`, `.cfg`, `.ini`, `.properties`, `.env`,
    `.lock`, and any text file with no known extension.
-   Notepad-style editing surface: monospace, optional word wrap,
    no highlighting.

## 13.3 Code / Data (read-only viewing)

Highlighted read-only viewing for: TypeScript/JavaScript, JSON/JSON5,
YAML, TOML, XML, HTML, CSS variants, Vue/Svelte/Astro, PHP, Python,
Ruby, Go, Rust, Java, Kotlin, C# and the usual backend/systems/shell/
query languages. Editing these in LightRead is out of scope.

Minified JSON under 2 MB is pretty-printed for display.

## 13.4 CSV / TSV

`.csv`/`.tsv` render as a table (sticky header, alternating rows,
delimiter auto-detected). Read-only.

## 13.5 Images

`.png .jpg .jpeg .webp .gif .bmp .ico .avif .tiff` — zoom, fit,
actual size, background checkerboard for transparency.

## 13.6 SVG

Preview (rendered) ↔ Source (highlighted XML), both read-only.

## 13.7 HTML

Sandboxed preview (`sandbox=""` iframe, no scripts) ↔ Source
(highlighted), both read-only.

## 13.8 Unsupported

Binary/unknown files show metadata (name, size, type) and an
**Open in default app** button.

------------------------------------------------------------------------

# 14. Editing Model

## 14.1 Editing Surface

-   Native-feeling plain text area: no highlighting, no line numbers
    required, monospace font at the configured size.
-   Word wrap setting applies.
-   Standard OS shortcuts work (copy/paste/undo/redo via native
    textarea behavior).
-   Tab key inserts 2 spaces (notepad-like).

## 14.2 Which Files Are Editable

-   `markdown` and `text` viewer types only.
-   Everything else is read-only. No exceptions.

## 14.3 Dirty State and Saving

-   Tab title shows `•` when modified.
-   `Ctrl+S` writes via a Rust command `write_text_file(path, contents)`.
-   Save preserves UTF-8 encoding. (Non-UTF-8 files loaded lossily are
    saved as UTF-8 — status bar must show encoding.)
-   On tab close or app exit with unsaved changes: Save / Don't Save /
    Cancel.
-   `Ctrl+Shift+S`: Save As (OS save dialog; writes the draft to the
    chosen path and retargets the tab).

## 14.4 External Change Conflicts

-   File watcher reports external change for a file with **no local
    edits**: auto-reload.
-   External change for a file with **unsaved edits**: banner —
    **Reload from disk / Keep mine**. Never silently discard unsaved
    edits.
-   Successful save clears the changed flag.

## 14.5 Large Files

-   Files above the large-file threshold (10 MB) open read-only,
    truncated, with a notice. Editing is disabled for truncated files.

## 14.6 Find and Replace

-   Find in current file (`Ctrl+F`): match navigation via
    Enter/Shift+Enter, match-case toggle.
-   Replace (`Ctrl+H`): replace / replace-all for editable files;
    disabled in read-only surfaces.

------------------------------------------------------------------------

# 15. Viewer UX (Read-Only Types)

## 15.1 Code Viewer

-   Shiki-based highlighting, themes follow app theme (auto light/dark
    or fixed theme from settings).
-   Line numbers (setting), word wrap (setting), copy button.
-   Core languages load at startup; the rest load on demand.
-   No folding, no minimap, no editing.

## 15.2 JSON Viewer

Rendered as code (highlighted). Minified JSON under 2 MB is
pretty-printed for display.

## 15.3 Image Viewer

-   Fit-to-window default; zoom in/out/actual-size; pan when zoomed;
    wheel + Ctrl to zoom.
-   Checkerboard background for transparency.
-   File size shown; loading state for large images.

## 15.4 HTML / SVG Preview

-   `iframe sandbox=""` with `srcDoc`. No script execution.
-   Source tab shows highlighted code.

## 15.5 CSV Viewer

-   Table rendering per §13.4. Follows the font-size setting.

## 15.6 Unsupported Viewer

-   Icon + file name + size + detected type label.
-   Buttons: **Open in default app** (system opener), **Copy path**.

------------------------------------------------------------------------

# 16. Tabs

-   One tab per file. Reopening focuses the existing tab.
-   Close: middle-click, `Ctrl+W`; close others / close all via context
    menu.
-   Cycle: `Ctrl+Tab`, `Ctrl+Shift+Tab`.
-   Dirty indicator `•` on unsaved edits (§14.3).
-   Tab shows filename; full path in tooltip.

------------------------------------------------------------------------

# 17. Quick Open

-   `Ctrl+P` palette over the open workspace.
-   Fuzzy match on relative path; Enter opens top result.
-   Recent files included when no folder is open.

------------------------------------------------------------------------

# 18. Search

## 18.1 File Tree Filter

Sidebar filter-as-you-type on file names.

## 18.2 Search in Project

-   `Ctrl+Shift+F` dialog.
-   Rust-side recursive content search, case-sensitive toggle.
-   Results grouped by file; click jumps to file. Skips ignored dirs,
    dotfiles, binary and >5 MB files. Result cap 500.

## 18.3 Find in File

-   `Ctrl+F` in-bar for current file (all viewer types where text
    exists), `Ctrl+H` adds replace for editable files.

------------------------------------------------------------------------

# 19. Breadcrumbs

Path segments of the active file relative to workspace root.
Display-first.

------------------------------------------------------------------------

# 20. Recent Files and Projects

-   Persisted (zustand persist): recents list with name, path, kind,
    timestamp.
-   Shown on welcome screen and sidebar.
-   Clear-all action. Cap ~20 entries.

------------------------------------------------------------------------

# 21. File Change Detection

-   Rust watcher (debounced ~500 ms) per open file.
-   Frontend event `file-changed` → per §14.4 conflict rules.
-   Watcher stopped on tab close; all stopped on workspace change/exit.

------------------------------------------------------------------------

# 22. Large File Handling

-   Metadata check before load: size, binary sniff (magic bytes +
    null-byte heuristic).
-   Text files >10 MB: truncated load + banner "File truncated at 10 MB
    — read-only".
-   Files >100 MB: refuse text load, show unsupported viewer with
    metadata.
-   Images metadata still shown; huge images render scaled.

------------------------------------------------------------------------

# 23. Performance Requirements

-   Cold start < 1 s typical.
-   Open file → visible < 100 ms for files < 1 MB (excluding first
    highlighter warm-up).
-   Typing latency must be imperceptible (native textarea does the
    work; no per-keystroke highlight recompute in edit mode).
-   Folder tree load for 1k+ entries without UI freeze (async invoke).
-   Project search capped; runs off the UI thread (Rust command).

------------------------------------------------------------------------

# 24. Security Architecture

-   CSP as configured in `tauri.conf.json` (no remote origins).
-   Markdown preview: raw HTML **stripped** (no `rehype-raw`).
-   HTML/SVG preview: `sandbox=""` iframes — no scripts, no same-origin
    access.
-   HTML/SVG served via `srcDoc`, not file URLs.
-   Images via Tauri asset protocol (`convertFileSrc`) scoped to opened
    files.
-   External links: system opener only, never in-app navigation.
-   Never execute user files. No terminal exists.

## 24.1 Capability Permissions (Tauri)

Keep minimal:

-   `core:default`, window fullscreen query/set
-   `dialog:allow-open` (open file/folder), `dialog:allow-save` (Save As)
-   `opener:default` + `opener:allow-open-path` (external links /
    open-with)

Rust plugins in use: `tauri-plugin-dialog`, `tauri-plugin-opener`,
`tauri-plugin-single-instance`, `tauri-plugin-log` (release builds log
to a rotating file in the OS log dir).

Build/release: GitHub Actions (`.github/workflows/release.yml`) matrix —
Windows (NSIS + portable exe), macOS (DMG, aarch64 + x86_64, ad-hoc
signing until a Developer ID exists), Linux (AppImage + deb).

Adding any permission requires justification in the PR.

## 24.2 Filesystem Scope

All file IO goes through custom Rust commands, not the Tauri fs plugin
ACL. Mutation commands (`write_text_file`, `create_file`, `create_dir`,
`rename_path`, `delete_path`) write exactly the given path string — no
globbing. `delete_path` moves to the OS trash (never a permanent delete).

------------------------------------------------------------------------

# 25. Theme and Typography

-   Light/dark/system. Follow OS by default.
-   Reader typography: font size setting (12–24 px), line height tuned
    for prose; code/monospace surfaces use the code font size setting.
-   Word wrap setting for text/code surfaces.

------------------------------------------------------------------------

# 26. Copy Behavior

-   All viewers support selecting and copying rendered text natively.
-   Copy buttons: whole-file copy in code viewer; per-code-block copy
    in Markdown preview.
-   Copy path actions in status bar / unsupported viewer.

------------------------------------------------------------------------

# 27. Keyboard Shortcuts

| Shortcut         | Action                          |
| ---------------- | ------------------------------- |
| `Ctrl+O`         | Open file                       |
| `Ctrl+Shift+O`   | Open folder                     |
| `Ctrl+S`         | Save                            |
| `Ctrl+Shift+S`   | Save As                         |
| `Ctrl+W`         | Close tab                       |
| `Ctrl+Tab`       | Next tab                        |
| `Ctrl+Shift+Tab` | Previous tab                    |
| `Ctrl+P`         | Quick open                      |
| `Ctrl+F`         | Find in file                    |
| `Ctrl+H`         | Find & replace                  |
| `Ctrl+Shift+F`   | Search in project               |
| `Ctrl+B`         | Toggle sidebar                  |
| `Ctrl+Shift+V`   | Toggle Markdown source/preview  |
| `Ctrl+=/-/0`     | Font size +/-/reset             |
| `Ctrl+,`         | Settings                        |
| `F11`            | Fullscreen                      |
| `Escape`         | Close overlays (find, dialogs)  |

------------------------------------------------------------------------

# 28. Desktop Integration

-   File associations for `.md`, `.markdown`, `.txt`, `.log`
    ("Open with LightRead"). Windows: installer registry; macOS: UTType;
    Linux: `.desktop` MimeType entries.
-   Drag-and-drop: dropping files or folders onto the window opens tabs
    or switches the workspace folder.
-   Single-instance behavior: opening a file when LightRead is already
    running focuses the app and opens a tab (args forwarded via
    single-instance plugin event).
-   In-app auto-updater: Tauri updater plugin verifying against GitHub
    Releases latest artifacts with minisign cryptographic signatures.
-   DPI-aware rendering (Tauri default).

------------------------------------------------------------------------

# 29. Application State

Persisted (localStorage via zustand persist):

-   `settings`: theme, fontSize, lineHeight, wordWrap, showLineNumbers,
    codeTheme, autoRefresh, markdownDefaultMode, sidebarWidth. Deep-merged
    with defaults on hydrate to keep newly added settings resilient.
-   `recents`.
-   `sessionTabs` / `sessionActive`: open-tab **paths** restored on
    launch. Drafts (unsaved content) are never persisted.

Not persisted: file contents, dirty drafts, tree expansion.

------------------------------------------------------------------------

# 30. Architecture

```
src/
  stores/app-store.ts        — zustand store (tabs, drafts, settings, recents, session)
  lib/tauri-api.ts           — typed invoke wrappers
  lib/file-types/registry.ts — detection
  components/
    layout/                  — shell, sidebar, status bar, welcome
    explorer/                — file tree
    tabs/                    — tab bar (dirty indicators)
    navigation/              — quick open, find bar, project search, toolbar, breadcrumbs
    viewers/                 — markdown, text-editor, code, csv, image, svg, html, unsupported
    settings/                — settings dialog
  hooks/                     — keyboard shortcuts, theme, file watcher
src-tauri/src/
  lib.rs                     — commands + app wiring (single-instance)
  filesystem.rs              — read_text_file, read_text_file_lossy,
                               read_directory, get_file_metadata,
                               file_exists, write_text_file
  watchers.rs                — file change watching
  search.rs                  — project content search
```

------------------------------------------------------------------------

# 31. Error Handling

-   Load failure: inline error surface with path + message + retry.
-   Save failure (permissions, disk): error banner + keep dirty state.
    Never lose user input.
-   Watcher failures: log-only.
-   All Rust errors surface as readable strings.

------------------------------------------------------------------------

# 32. Encoding

-   Read: try strict UTF-8; fall back to lossy read (replacement
    chars). Status bar shows `UTF-8` or `UTF-8 (lossy)`.
-   Write: always UTF-8. Lossy-loaded file saved as UTF-8 (noted via
    encoding indicator).

------------------------------------------------------------------------

# 33. Accessibility

-   All controls keyboard-reachable; visible focus states.
-   Dialogs have titles; icon-only buttons have `title`/aria-label.
-   Reader surfaces respect font size settings; contrast follows theme.

------------------------------------------------------------------------

# 34. Implemented Scope

-   [x] Explorer, tabs, quick open, project search, find bar
-   [x] Live file tree (recursive watch, external changes auto-refresh)
-   [x] Sidebar create file/folder, inline rename, move to trash
-   [x] Code/CSV/image/SVG/HTML/unsupported viewers
-   [x] Markdown render + hardening (no raw HTML, local images,
        relative links, anchors)
-   [x] Plain-text editor for `text` + Markdown source
-   [x] `write_text_file` Rust command + `Ctrl+S` save flow
-   [x] Dirty indicators + unsaved-close prompts (tab close and app exit)
-   [x] Markdown source/preview toggle per file
-   [x] External-change conflict handling (auto-reload / keep-mine)
-   [x] Status bar: line/col, words/chars, encoding
-   [x] Find & replace (`Ctrl+H`)
-   [x] Save As (`Ctrl+Shift+S`)
-   [x] Session restore (tab paths, never drafts)
-   [x] File association + single-instance "Open with LightRead"
-   [x] Pretty JSON display
-   [x] `.csv`/`.tsv` table view
-   [x] Recents, watchers, settings, shortcuts, themes
-   [x] Native drag-and-drop for files and folders
-   [x] In-app auto-updater with signature verification and restart flow

------------------------------------------------------------------------

# 35. Acceptance Criteria

1.  Opening a 5 MB `.txt` shows editable content < 200 ms.
2.  Editing + `Ctrl+S` round-trips file content byte-for-byte (UTF-8).
3.  Closing an edited tab prompts; Cancel keeps the tab open.
4.  `.md` toggles Source/Preview; preview renders GFM tables and
    highlighted code blocks; raw HTML in Markdown is not rendered.
5.  Local image in Markdown preview displays; relative link to another
    file opens that file in a tab; `https://` links open externally.
6.  Code files open read-only with highlighting; typing does nothing.
7.  No terminal, media player library, or module switcher anywhere in UI
    bundle. (Audio/video preview playback is allowed — see §11.)
8.  External edit with no local changes reloads automatically; with
    local changes, banner appears.
9.  All shortcuts in §27 work.
10. `cargo check` + `bun run build` + `bun tauri build` pass.

------------------------------------------------------------------------

# 36. Development Rules for AI Coding Agents

1.  **Plain text editing only.** No WYSIWYG, no rich text, no
    CodeMirror/Monaco/TipTap. A native textarea (or equivalent plain
    surface) is the editor.
2.  **Code viewers stay read-only.** Never make `code` viewerType
    editable.
3.  **Never execute user files.** No terminal, no eval, no script
    execution paths.
4.  **No raw HTML in Markdown.** Strip it. HTML/SVG previews only in
    `sandbox=""` iframes via `srcDoc`.
5.  **All mutations go through Rust commands** (`write_text_file`,
    `create_file`, `create_dir`, `rename_path`, `delete_path`) with exact
    path semantics. No fs plugin ACL. Delete only ever moves to the OS
    trash — never permanent, never silent.
6.  **Never lose user input.** Save errors keep dirty state; external
    conflicts never silently overwrite.
7.  **Keep permissions minimal** (capabilities file). Adding a
    permission requires justification in the PR.
8.  **No terminal, media player library, or module switcher.** Do not add
    them back; reject features that require them. (Basic `<audio>`/`<video>`
    preview playback is fine.)
9.  **Media is preview-only** — images, audio, and video open in a basic
    preview player (native `<audio>`/`<video>`, autoplay, codec-unsupported
    error card). No playlists, no library, no equalizer.
10. Keep dependencies from growing: no new runtime dependency unless
    stdlib/platform truly cannot do it.

------------------------------------------------------------------------

# 37. Definition of Done

-   All §34 items checked.
-   §35 acceptance criteria verified manually on Windows. macOS/Linux
    binaries ship via CI but are best-effort until community testing.
-   `cargo check`, `bun run build`, `bun tauri build` all green.
-   CHANGELOG updated.

------------------------------------------------------------------------

# 38. Product Success Criteria

> A user with a folder of notes/docs sets LightRead as their default
> way to open them: it opens instantly, reads beautifully, edits
> simply, and saves reliably. They never wait, and they never need
> anything else.
