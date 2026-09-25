import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { pickFile, pickFolder } from "@/lib/tauri-api";
import { DEFAULT_SETTINGS, useStore } from "@/stores/app-store";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = useStore.getState();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key = e.key.toLowerCase(); // CapsLock/layout must not break letters
      // Dialog inputs own their keystrokes — don't steal open/find shortcuts
      // while a modal (quick open, settings, project search, open recent) has focus.
      const inModal = s.quickOpenOpen || s.settingsOpen || s.projectSearchOpen || s.recentOpen;

      if (ctrl && shift && key === "o" && !inModal) {
        e.preventDefault();
        pickFolder().then((p) => {
          if (p) s.openFolder(p);
        });
        return;
      }
      if (ctrl && !shift && key === "o" && !inModal) {
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
      if (ctrl && !shift && key === "p" && !inModal) {
        e.preventDefault();
        s.setQuickOpenOpen(true);
        return;
      }
      if (ctrl && !shift && key === "r") {
        e.preventDefault();
        s.setRecentOpen(!s.recentOpen);
        return;
      }
      if (ctrl && !shift && key === "f" && !inModal) {
        e.preventDefault();
        s.setFindOpen(true);
        return;
      }
      if (ctrl && !shift && key === "h" && !inModal) {
        e.preventDefault();
        s.setFindOpen(true, true);
        return;
      }
      if (ctrl && shift && key === "f" && !inModal) {
        e.preventDefault();
        s.setProjectSearchOpen(true);
        return;
      }
      if (ctrl && !shift && key === "w" && !inModal) {
        e.preventDefault();
        if (s.activeTabId) s.closeTab(s.activeTabId);
        return;
      }
      if (ctrl && (e.code === "Tab" || e.key === "Tab") && !inModal) {
        e.preventDefault();
        if (shift) s.prevTab();
        else s.nextTab();
        return;
      }
      if (ctrl && (e.key === "=" || e.key === "+" || e.key === "-" || e.key === "0")) {
        const { fontSize } = s.settings;
        const next =
          e.key === "0"
            ? DEFAULT_SETTINGS.fontSize
            : Math.min(28, Math.max(10, fontSize + (e.key === "-" ? -1 : 1)));
        if (next !== fontSize) {
          e.preventDefault();
          s.updateSettings({ fontSize: next });
        }
        return;
      }
      if (ctrl && key === "b" && !inModal) {
        e.preventDefault();
        s.toggleSidebar();
        return;
      }
      if (ctrl && e.key === "," && !inModal) {
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
        // Fullscreen first: Esc returns to windowed and consumes the key —
        // dialogs must not also close underneath the un-fullscreen animation.
        const win = getCurrentWindow();
        win.isFullscreen().then((fs) => {
          if (fs) {
            win.setFullscreen(false);
            return;
          }
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
          if (s.recentOpen) {
            s.setRecentOpen(false);
            return;
          }
          if (s.findOpen) {
            s.setFindOpen(false);
          }
        });
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
