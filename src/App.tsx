import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { FileUp, FolderDown } from "lucide-react";

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

  const [isDragOver, setIsDragOver] = useState(false);
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

  // Restore last session's workspace folder + tabs (paths only — drafts are
  // never restored).
  useEffect(() => {
    const s = useStore.getState();
    if (s.tabs.length > 0) return;
    let cancelled = false;
    (async () => {
      if (s.sessionRootPath) await s.openFolder(s.sessionRootPath).catch(() => {});
      if (cancelled) return;
      for (const p of s.sessionTabs) {
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

  // Native Tauri v2 window drag-and-drop listener for external files/folders.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    getCurrentWindow()
      .onDragDropEvent(async (event) => {
        const payload = event.payload;
        if (payload.type === "enter") {
          setIsDragOver(true);
        } else if (payload.type === "leave") {
          setIsDragOver(false);
        } else if (payload.type === "drop") {
          setIsDragOver(false);
          for (const p of payload.paths) {
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
        }
      })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [openFile, openFolder]);

  return (
    <TooltipProvider delay={300}>
      <div className="relative h-screen w-screen overflow-hidden">
        <AppShell />
        {isDragOver && (
          <div className="fade-in-0 pointer-events-none absolute inset-0 z-50 flex animate-in flex-col items-center justify-center gap-3 border-2 border-primary border-dashed bg-background/85 backdrop-blur-sm duration-150">
            <div className="flex items-center gap-3 text-primary">
              <FolderDown className="size-10 stroke-[1.5]" />
              <FileUp className="size-10 stroke-[1.5]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base text-foreground">Drop files or folder here</p>
              <p className="text-muted-foreground text-xs">
                Folders will open in explorer, files in new tabs
              </p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
