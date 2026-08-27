import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

import { treeEventGuard, useStore } from "@/stores/app-store";

export function useFileWatcher() {
  const markFileChanged = useStore((s) => s.markFileChanged);
  const refreshTree = useStore((s) => s.refreshTree);

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    listen<string>("file-changed", (event) => {
      markFileChanged(event.payload);
    }).then((fn) => {
      if (cancelled) {
        fn();
      } else {
        unlisten = fn;
      }
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [markFileChanged]);

  // External deletes/renames anywhere in the workspace → reload the tree.
  // Rust debounces to 500ms; trailing timer coalesces bursts (e.g. git checkout).
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    listen<string>("tree-changed", () => {
      // Skip events our own refresh reads produced (WSL/drvfs emit on reads).
      if (Date.now() < treeEventGuard.until) return;
      clearTimeout(timer);
      timer = setTimeout(() => refreshTree().catch(() => {}), 300);
    }).then((fn) => {
      if (cancelled) {
        fn();
      } else {
        unlisten = fn;
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unlisten?.();
    };
  }, [refreshTree]);
}
