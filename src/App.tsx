import { useCallback, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { TooltipProvider } from "@kumix/ui/ui/tooltip";
import { AppShell } from "@/components/layout/app-shell";
import { useFileWatcher } from "@/hooks/use-file-watcher";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useTheme } from "@/hooks/use-theme";
import { getFileMetadata, pickFile, pickFolder } from "@/lib/tauri-api";
import { useStore } from "@/stores/app-store";

export default function App() {
  useTheme();
  useKeyboardShortcuts();
  useFileWatcher();

  const openFile = useStore((s) => s.openFile);
  const openFolder = useStore((s) => s.openFolder);

  const handleOpenFile = useCallback(async () => {
    const path = await pickFile();
    if (path) await openFile(path);
  }, [openFile]);

  const handleOpenFolder = useCallback(async () => {
    const path = await pickFolder();
    if (path) await openFolder(path);
  }, [openFolder]);

  useEffect(() => {
    window.__lightread = {
      openFile: handleOpenFile,
      openFolder: handleOpenFolder,
    };
  }, [handleOpenFile, handleOpenFolder]);

  // Restore last session's tabs (paths only — drafts are never restored).
  useEffect(() => {
    const s = useStore.getState();
    const paths = s.sessionTabs;
    if (paths.length === 0 || s.tabs.length > 0) return;
    let cancelled = false;
    (async () => {
      for (const p of paths) {
        if (cancelled) return;
        await s.openFile(p).catch(() => {});
      }
      if (cancelled) return;
      if (s.sessionActive && useStore.getState().tabs.some((t) => t.id === s.sessionActive)) {
        useStore.setState({ activeTabId: s.sessionActive });
      }
      useStore.setState({ fileError: null });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // "Open with LightRead" from Explorer: second instance forwards here.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<string[]>("single-instance", (e) => {
      const file = e.payload[e.payload.length - 1];
      if (file) useStore.getState().openFile(file);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, []);

  // Intercept window close: prompt for unsaved tabs before exit.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    getCurrentWindow()
      .onCloseRequested((event) => {
        event.preventDefault();
        useStore.getState().requestAppExit();
      })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const items = e.dataTransfer.items;
      if (!items) return;

      const paths: string[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            paths.push((file as File & { path?: string }).path || file.name);
          }
        }
      }

      for (const p of paths) {
        try {
          const meta = await getFileMetadata(p);
          if (meta.is_dir) {
            await openFolder(p);
          } else {
            await openFile(p);
          }
        } catch {
          await openFile(p);
        }
      }
    },
    [openFile, openFolder],
  );

  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  return (
    <TooltipProvider delay={300}>
      <div onDrop={handleDrop} className="h-screen w-screen overflow-hidden">
        <AppShell />
      </div>
    </TooltipProvider>
  );
}
