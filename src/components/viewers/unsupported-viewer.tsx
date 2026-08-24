import { ExternalLink, FileWarning } from "lucide-react";

import { openInDefaultApp } from "@/lib/tauri-api";
import { formatBytes } from "@/lib/utils";
import type { LoadedFile } from "@/types";

interface UnsupportedViewerProps {
  file: LoadedFile;
}

export function UnsupportedViewer({ file }: UnsupportedViewerProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-linear-to-b from-background to-muted/20 p-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-muted/50">
        <FileWarning className="size-10 text-muted-foreground/50" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-semibold text-foreground text-lg">Unsupported File Type</h3>
        <p className="text-muted-foreground text-sm">LightRead cannot preview this file.</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm">
        <span className="font-medium text-foreground">{file.name}</span>
        <span className="text-muted-foreground/50">·</span>
        <span className="text-muted-foreground">{formatBytes(file.size)}</span>
      </div>
      <button
        onClick={() => openInDefaultApp(file.path)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90"
      >
        <ExternalLink className="size-4" />
        Open Externally
      </button>
    </div>
  );
}
