import { ExternalLink, FileWarning } from "lucide-react";

import { openInDefaultApp } from "@/lib/tauri-api";
import { formatBytes } from "@/lib/utils";
import type { LoadedFile } from "@/types";

interface UnsupportedViewerProps {
  file: LoadedFile;
}

export function UnsupportedViewer({ file }: UnsupportedViewerProps) {
  return (
    <div className="from-background to-muted/20 flex h-full flex-col items-center justify-center gap-5 bg-linear-to-b p-8 text-center">
      <div className="bg-muted/50 flex size-20 items-center justify-center rounded-2xl">
        <FileWarning className="text-muted-foreground/50 size-10" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-foreground text-lg font-semibold">Unsupported File Type</h3>
        <p className="text-muted-foreground text-sm">LightRead cannot preview this file.</p>
      </div>
      <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm">
        <span className="text-foreground font-medium">{file.name}</span>
        <span className="text-muted-foreground/50">·</span>
        <span className="text-muted-foreground">{formatBytes(file.size)}</span>
      </div>
      <button
        onClick={() => openInDefaultApp(file.path)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium shadow-sm transition-colors"
      >
        <ExternalLink className="size-4" />
        Open Externally
      </button>
    </div>
  );
}
