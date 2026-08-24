import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

import { useStore } from "@/stores/app-store";

export function useFileWatcher() {
  const markFileChanged = useStore((s) => s.markFileChanged);

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
}
