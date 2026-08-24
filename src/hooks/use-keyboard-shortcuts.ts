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

      if (ctrl && shift && e.key === "O") {
        e.preventDefault();
        pickFolder().then((p) => {
          if (p) s.openFolder(p);
        });
        return;
      }
      if (ctrl && !shift && e.key === "o") {
        e.preventDefault();
        pickFile().then((p) => {
          if (p) s.openFile(p);
        });
        return;
      }
      if (ctrl && !shift && e.key === "s") {
        e.preventDefault();
        s.saveActiveTab();
        return;
      }
      if (ctrl && shift && (e.key === "S" || e.key === "s")) {
        if (s.activeTabId) {
          e.preventDefault();
          s.saveTabAs(s.activeTabId);
        }
        return;
      }
      if (ctrl && shift && (e.key === "V" || e.key === "v")) {
        const tab = s.tabs.find((t) => t.id === s.activeTabId);
        if (tab?.file.viewerType === "markdown") {
          e.preventDefault();
          s.setPreviewMode(tab.id, !tab.previewMode);
        }
        return;
      }
      if (ctrl && !shift && e.key === "p") {
        e.preventDefault();
        s.setQuickOpenOpen(true);
        return;
      }
      if (ctrl && !shift && e.key === "f") {
        e.preventDefault();
        s.setFindOpen(true);
        return;
      }
      if (ctrl && !shift && e.key === "h") {
        e.preventDefault();
        s.setFindOpen(true, true);
        return;
      }
      if (ctrl && shift && (e.key === "F" || e.key === "f")) {
        e.preventDefault();
        s.setProjectSearchOpen(true);
        return;
      }
      if (ctrl && !shift && e.key === "w") {
        e.preventDefault();
        if (s.activeTabId) s.closeTab(s.activeTabId);
        return;
      }
      if (ctrl && e.key === "Tab") {
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
      if (ctrl && e.key === "b") {
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
