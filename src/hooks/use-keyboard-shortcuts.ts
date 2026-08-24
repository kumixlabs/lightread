import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { pickFile, pickFolder } from "@/lib/tauri-api";
import { useStore } from "@/stores/app-store";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = useStore.getState();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key = e.key.toLowerCase(); // CapsLock/layout must not break letters

      if (ctrl && shift && key === "o") {
        e.preventDefault();
        pickFolder().then((p) => {
          if (p) s.openFolder(p);
        });
        return;
      }
      if (ctrl && !shift && key === "o") {
        e.preventDefault();
        pickFile().then((p) => {
          if (p) s.openFile(p);
        });
        return;
      }
      if (ctrl && !shift && key === "s") {
        e.preventDefault();
        s.saveActiveTab();
        return;
      }
      if (ctrl && shift && key === "s") {
        if (s.activeTabId) {
          e.preventDefault();
          s.saveTabAs(s.activeTabId);
        }
        return;
      }
      if (ctrl && shift && key === "v") {
        const tab = s.tabs.find((t) => t.id === s.activeTabId);
        if (tab?.file.viewerType === "markdown") {
          e.preventDefault();
          s.setPreviewMode(tab.id, !tab.previewMode);
        }
        return;
      }
      if (ctrl && !shift && key === "p") {
        e.preventDefault();
        s.setQuickOpenOpen(true);
        return;
      }
      if (ctrl && !shift && key === "f") {
        e.preventDefault();
        s.setFindOpen(true);
        return;
      }
      if (ctrl && !shift && key === "h") {
        e.preventDefault();
        s.setFindOpen(true, true);
        return;
      }
      if (ctrl && shift && key === "f") {
        e.preventDefault();
        s.setProjectSearchOpen(true);
        return;
      }
      if (ctrl && !shift && key === "w") {
        e.preventDefault();
        if (s.activeTabId) s.closeTab(s.activeTabId);
        return;
      }
      if (ctrl && (e.code === "Tab" || e.key === "Tab")) {
        e.preventDefault();
        if (shift) s.prevTab();
        else s.nextTab();
        return;
      }
      if (ctrl && (e.key === "=" || e.key === "+" || e.key === "-" || e.key === "0")) {
        const { fontSize } = s.settings;
        const next =
          e.key === "0" ? 14 : Math.min(28, Math.max(10, fontSize + (e.key === "-" ? -1 : 1)));
        if (next !== fontSize) {
          e.preventDefault();
          s.updateSettings({ fontSize: next });
        }
        return;
      }
      if (ctrl && key === "b") {
        e.preventDefault();
        s.toggleSidebar();
        return;
      }
      if (ctrl && e.key === ",") {
        e.preventDefault();
        s.setSettingsOpen(true);
        return;
      }
      if (e.key === "F11") {
        e.preventDefault();
        const win = getCurrentWindow();
        win.isFullscreen().then((fs) => win.setFullscreen(!fs));
        return;
      }
      if (e.key === "Escape") {
        // Fullscreen first: Esc always returns to windowed like native apps.
        const win = getCurrentWindow();
        win.isFullscreen().then((fs) => {
          if (fs) win.setFullscreen(false);
        });
        if (s.settingsOpen) {
          s.setSettingsOpen(false);
          return;
        }
        if (s.pendingClose) return; // dialog handles its own keys
        if (s.projectSearchOpen) {
          s.setProjectSearchOpen(false);
          return;
        }
        if (s.quickOpenOpen) {
          s.setQuickOpenOpen(false);
          return;
        }
        if (s.findOpen) {
          s.setFindOpen(false);
          return;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
