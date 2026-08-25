import { exit } from "@tauri-apps/plugin-process";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  grantAssetScope,
  loadFile,
  pickSavePath,
  readDirectory,
  startFileWatch,
  stopAllWatches,
  stopFileWatch,
  writeTextFile,
} from "@/lib/tauri-api";
import { basename } from "@/lib/utils";
import type { AppSettings, FileNode, RecentEntry, Tab } from "@/types";

// Path → time of our own write. Watcher events within the window are ours,
// not external edits (debouncer fires ~500ms after the fs write).
const selfWrites = new Map<string, number>();
const SELF_WRITE_WINDOW_MS = 2000;

interface PendingClose {
  tabIds: string[];
  /** Close the window after resolving (app exit flow). */
  exitAfter?: boolean;
}

interface AppState {
  workspace: {
    rootPath: string | null;
    rootName: string | null;
    tree: FileNode[];
    loading: boolean;
  };

  tabs: Tab[];
  activeTabId: string | null;
  expandedDirs: Set<string>;

  fileSearch: string;
  findOpen: boolean;
  /** Replace row visible in the find bar (Ctrl+H). */
  findReplace: boolean;
  findQuery: string;
  findCaseSensitive: boolean;
  findIndex: number;
  quickOpenOpen: boolean;
  settingsOpen: boolean;
  projectSearchOpen: boolean;
  sidebarVisible: boolean;

  fileLoading: boolean;
  fileError: string | null;
  changedFiles: Set<string>;
  /** Unsaved-close confirmation (Save/Don't save/Cancel). */
  pendingClose: PendingClose | null;
  /** Cursor position of the active editable surface (for status bar). */
  cursor: { line: number; col: number };
  /** Session restore: persisted open-tab paths (content is NOT restored). */
  sessionTabs: string[];
  sessionActive: string | null;
  sessionRootPath: string | null;
  setCursor: (line: number, col: number) => void;

  settings: AppSettings;
  recents: RecentEntry[];

  openFolder: (path: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (tabId: string) => void;
  nextTab: () => void;
  prevTab: () => void;

  toggleDir: (path: string) => void;
  setFileSearch: (query: string) => void;
  setFindOpen: (open: boolean, replace?: boolean) => void;
  setFindCaseSensitive: (v: boolean) => void;
  setFindIndex: (i: number) => void;
  setFindQuery: (query: string) => void;
  setQuickOpenOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setProjectSearchOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;

  reloadFile: (tabId: string) => Promise<void>;
  markFileChanged: (path: string) => void;
  clearFileChanged: (path: string) => void;
  refreshTree: () => Promise<void>;
  expandAll: () => Promise<void>;

  /** Editing */
  updateDraft: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => Promise<boolean>;
  saveActiveTab: () => Promise<void>;
  /** Save As: OS dialog, writes draft to a new path and retargets the tab. */
  saveTabAs: (tabId: string) => Promise<void>;
  setPreviewMode: (tabId: string, preview: boolean) => void;
  setEditMode: (tabId: string, editing: boolean) => void;
  resolvePendingClose: (action: "save" | "discard" | "cancel") => Promise<void>;
  /** Intercept window close; prompts for unsaved tabs. */
  requestAppExit: () => Promise<void>;

  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  addRecent: (entry: RecentEntry) => void;
  clearRecents: () => void;
}

function isDirty(tab: Tab | undefined): boolean {
  return !!tab && tab.draft !== undefined && tab.draft !== tab.file.content;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  fontSize: 14,
  lineHeight: 1.75,
  sidebarWidth: 260,
  showLineNumbers: true,
  wordWrap: true,
  autoRefresh: true,
  codeTheme: "auto",
  markdownDefaultMode: "source",
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      workspace: { rootPath: null, rootName: null, tree: [], loading: false },

      tabs: [],
      activeTabId: null,
      expandedDirs: new Set<string>(),

      fileSearch: "",
      findOpen: false,
      findReplace: false,
      findQuery: "",
      findCaseSensitive: false,
      findIndex: 0,
      quickOpenOpen: false,
      settingsOpen: false,
      projectSearchOpen: false,
      sidebarVisible: true,

      fileLoading: false,
      fileError: null,
      changedFiles: new Set<string>(),
      pendingClose: null,
      cursor: { line: 1, col: 1 },
      sessionTabs: [],
      sessionActive: null,
      sessionRootPath: null,

      settings: DEFAULT_SETTINGS,
      recents: [],

      openFolder: async (path: string) => {
        set({ workspace: { rootPath: null, rootName: null, tree: [], loading: true } });
        try {
          await stopAllWatches();
          // Await before reading so any first image render is authorized (no race).
          await grantAssetScope(path, true).catch(() => {});
          const tree = await readDirectory(path);
          set({
            workspace: { rootPath: path, rootName: basename(path), tree, loading: false },
            expandedDirs: new Set([path]),
          });
          // Watches were stopped globally; restart for tabs that stay open.
          for (const t of get().tabs) {
            startFileWatch(t.file.path).catch(() => {});
          }
          get().addRecent({ path, name: basename(path), isDir: true, openedAt: Date.now() });
        } catch (e) {
          set((state) => ({
            workspace: { ...state.workspace, loading: false },
            fileError: String(e),
          }));
        }
      },

      openFile: async (path: string) => {
        const existing = get().tabs.find((t) => t.file.path === path);
        if (existing) {
          set({ activeTabId: existing.id });
          return;
        }
        set({ fileLoading: true, fileError: null });
        try {
          // Await first: authorize asset scope before the file viewer renders.
          await grantAssetScope(path, false).catch(() => {});
          const file = await loadFile(path);
          const tab: Tab = {
            id: path,
            file,
            previewMode:
              file.viewerType === "markdown" && get().settings.markdownDefaultMode === "preview",
          };
          set((state) => ({
            tabs: [...state.tabs, tab],
            activeTabId: tab.id,
            fileLoading: false,
          }));
          get().addRecent({ path, name: file.name, isDir: false, openedAt: Date.now() });
          try {
            await startFileWatch(path);
          } catch (e) {
            console.warn("[lightread] Failed start file watch:", path, e);
          }
        } catch (e) {
          set({ fileLoading: false, fileError: String(e) });
        }
      },

      closeTab: (tabId: string) => {
        const tab = get().tabs.find((t) => t.id === tabId);
        if (isDirty(tab)) {
          set({ pendingClose: { tabIds: [tabId] } });
          return;
        }
        if (tab) stopFileWatch(tab.file.path).catch(() => {});
        set((state) => {
          const idx = state.tabs.findIndex((t) => t.id === tabId);
          const newTabs = state.tabs.filter((t) => t.id !== tabId);
          let newActive = state.activeTabId;
          if (state.activeTabId === tabId) {
            newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? null;
          }
          return { tabs: newTabs, activeTabId: newActive };
        });
      },

      closeOtherTabs: (tabId: string) => {
        const dirty = get().tabs.filter((t) => t.id !== tabId && isDirty(t));
        if (dirty.length > 0) {
          set({ pendingClose: { tabIds: dirty.map((t) => t.id) } });
          return;
        }
        for (const tab of get().tabs) {
          if (tab.id !== tabId) stopFileWatch(tab.file.path).catch(() => {});
        }
        const keep = get().tabs.find((t) => t.id === tabId);
        set({ tabs: keep ? [keep] : [], activeTabId: keep?.id ?? null });
      },

      closeAllTabs: () => {
        const dirty = get().tabs.filter((t) => isDirty(t));
        if (dirty.length > 0) {
          set({ pendingClose: { tabIds: dirty.map((t) => t.id) } });
          return;
        }
        for (const tab of get().tabs) stopFileWatch(tab.file.path).catch(() => {});
        set({ tabs: [], activeTabId: null });
      },

      setActiveTab: (tabId: string) => set({ activeTabId: tabId }),

      nextTab: () => {
        const { tabs, activeTabId } = get();
        if (tabs.length === 0) return;
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const next = tabs[(idx + 1) % tabs.length];
        set({ activeTabId: next.id });
      },

      prevTab: () => {
        const { tabs, activeTabId } = get();
        if (tabs.length === 0) return;
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
        set({ activeTabId: prev.id });
      },

      toggleDir: (path: string) => {
        set((state) => {
          const next = new Set(state.expandedDirs);
          if (next.has(path)) {
            next.delete(path);
          } else {
            next.add(path);
          }
          return { expandedDirs: next };
        });
      },

      setFileSearch: (query: string) => set({ fileSearch: query }),
      setFindOpen: (open, replace) =>
        set({
          findOpen: open,
          findQuery: open ? get().findQuery : "",
          findReplace: open ? (replace ?? get().findReplace) : false,
        }),
      setFindQuery: (query: string) => set({ findQuery: query }),
      setFindCaseSensitive: (v: boolean) => set({ findCaseSensitive: v }),
      setFindIndex: (i: number) => set({ findIndex: i }),
      setQuickOpenOpen: (open: boolean) => set({ quickOpenOpen: open }),
      setSettingsOpen: (open: boolean) => set({ settingsOpen: open }),
      setProjectSearchOpen: (open: boolean) => set({ projectSearchOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
      setSidebarVisible: (visible: boolean) => set({ sidebarVisible: visible }),

      reloadFile: async (tabId: string) => {
        const tab = get().tabs.find((t) => t.id === tabId);
        if (!tab) return;
        try {
          const file = await loadFile(tab.file.path);
          set((state) => ({
            tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, file, draft: undefined } : t)),
            changedFiles: (() => {
              const next = new Set(state.changedFiles);
              next.delete(tab.file.path);
              return next;
            })(),
          }));
        } catch (e) {
          set({ fileError: String(e) });
        }
      },

      markFileChanged: (path: string) => {
        const wrote = selfWrites.get(path);
        if (wrote && Date.now() - wrote < SELF_WRITE_WINDOW_MS) return; // our own save
        const tab = get().tabs.find((t) => t.file.path === path);
        if (!tab) return;
        // Never auto-overwrite unsaved edits — surface the banner instead.
        if (isDirty(tab) || tab.file.truncated) {
          set((state) => {
            const next = new Set(state.changedFiles);
            next.add(path);
            return { changedFiles: next };
          });
          return;
        }
        if (get().settings.autoRefresh) {
          get().reloadFile(tab.id);
          return;
        }
        set((state) => {
          const next = new Set(state.changedFiles);
          next.add(path);
          return { changedFiles: next };
        });
      },

      clearFileChanged: (path: string) =>
        set((state) => {
          const next = new Set(state.changedFiles);
          next.delete(path);
          return { changedFiles: next };
        }),

      refreshTree: async () => {
        const { rootPath } = get().workspace;
        if (!rootPath) return;
        const tree = await readDirectory(rootPath);
        set((state) => ({ workspace: { ...state.workspace, tree } }));
      },

      expandAll: async () => {
        const { tree } = get().workspace;
        if (tree.length === 0) return;
        const paths: string[] = [];
        // ponytail: full recursive expansion; if huge repos feel slow,
        // add a depth cap or switch to on-demand expansion per level.
        const walk = async (nodes: FileNode[]): Promise<void> => {
          await Promise.all(
            nodes
              .filter((n) => n.isDir)
              .map(async (n) => {
                paths.push(n.path);
                await walk(await readDirectory(n.path, 1));
              }),
          );
        };
        await walk(tree);
        set({ expandedDirs: new Set(paths) });
      },

      updateDraft: (tabId: string, content: string) => {
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, draft: content } : t)),
        }));
      },

      saveTab: async (tabId: string) => {
        const tab = get().tabs.find((t) => t.id === tabId);
        if (!tab || !isDirty(tab)) return true;
        try {
          selfWrites.set(tab.file.path, Date.now());
          await writeTextFile(tab.file.path, tab.draft!);
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                    ...t,
                    file: {
                      ...t.file,
                      content: t.draft!,
                      size: new Blob([t.draft!]).size,
                      lossy: false,
                    },
                    draft: undefined,
                  }
                : t,
            ),
            fileError: null,
          }));
          return true;
        } catch (e) {
          // Keep dirty state — never lose user input.
          set({ fileError: `Failed to save ${tab.file.name}: ${String(e)}` });
          return false;
        }
      },

      saveActiveTab: async () => {
        const id = get().activeTabId;
        if (id) await get().saveTab(id);
      },

      saveTabAs: async (tabId: string) => {
        const tab = get().tabs.find((t) => t.id === tabId);
        if (!tab) return;
        // Truncated/lossy content must not be silently written anywhere —
        // the user would believe they saved the full file.
        if (tab.file.truncated || tab.file.lossy) {
          set({
            fileError: `Save As unavailable for ${tab.file.name}: file is ${
              tab.file.truncated ? "truncated" : "not valid UTF-8"
            }. Original bytes stay untouched.`,
          });
          return;
        }
        const nextPath = await pickSavePath(tab.file.name);
        if (!nextPath) return;
        const contents = tab.draft ?? tab.file.content;
        await writeTextFile(nextPath, contents);
        stopFileWatch(tab.file.path).catch(() => {});
        const file = { ...tab.file, path: nextPath, name: basename(nextPath), content: contents };
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, id: nextPath, file, draft: undefined } : t,
          ),
          activeTabId: state.activeTabId === tabId ? nextPath : state.activeTabId,
        }));
        get().addRecent({ path: nextPath, name: file.name, isDir: false, openedAt: Date.now() });
        try {
          await startFileWatch(nextPath);
        } catch (e) {
          console.warn("[lightread] Failed start file watch:", nextPath, e);
        }
      },

      setPreviewMode: (tabId: string, preview: boolean) => {
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, previewMode: preview } : t)),
        }));
      },
      setEditMode: (tabId: string, editing: boolean) => {
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, editMode: editing } : t)),
        }));
      },

      resolvePendingClose: async (action: "save" | "discard" | "cancel") => {
        const pending = get().pendingClose;
        if (!pending) return;
        set({ pendingClose: null });
        if (action === "cancel") return;

        if (action === "save") {
          for (const id of pending.tabIds) {
            // Save failed → abort the close entirely. Tabs stay open with
            // drafts intact; the error banner shows why.
            if (!(await get().saveTab(id))) return;
          }
        }

        // Drop tabs (only reached when every save succeeded or user chose discard).
        for (const id of pending.tabIds) {
          const tab = get().tabs.find((t) => t.id === id);
          if (tab) stopFileWatch(tab.file.path).catch(() => {});
        }
        set((state) => {
          const ids = new Set(pending.tabIds);
          const idx = state.tabs.findIndex((t) => state.activeTabId === t.id);
          const newTabs = state.tabs.filter((t) => !ids.has(t.id));
          let newActive = state.activeTabId;
          if (ids.has(state.activeTabId ?? "")) {
            newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? null;
          }
          return { tabs: newTabs, activeTabId: newActive };
        });

        if (pending.exitAfter) {
          await exit(0);
        }
      },

      requestAppExit: async () => {
        const dirty = get().tabs.filter((t) => isDirty(t));
        if (dirty.length > 0) {
          set({ pendingClose: { tabIds: dirty.map((t) => t.id), exitAfter: true } });
          return;
        }
        await exit(0);
      },

      setCursor: (line, col) => set({ cursor: { line, col } }),

      updateSettings: (partial: Partial<AppSettings>) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),

      resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),

      addRecent: (entry: RecentEntry) =>
        set((state) => ({
          recents: [entry, ...state.recents.filter((r) => r.path !== entry.path)].slice(0, 20),
        })),

      clearRecents: () => set({ recents: [] }),
    }),
    {
      name: "lightread-store",
      storage: createJSONStorage(() => localStorage),
      // Deep-merge settings so newly added defaults (e.g. lineHeight) survive
      // restores from older persisted states instead of coming back undefined.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...(p.settings ?? {}) },
        };
      },
      partialize: (state) => ({
        recents: state.recents,
        settings: state.settings,
        sessionTabs: state.tabs.map((t) => t.file.path),
        sessionActive: state.activeTabId,
        sessionRootPath: state.workspace.rootPath,
      }),
    },
  ),
);
