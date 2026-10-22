import { useMemo, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { CircleAlert, ExternalLink, FileAudio, FileVideo } from "lucide-react";

import { VIDEO_EXTENSIONS } from "@/lib/file-types/registry";
import { openInDefaultApp } from "@/lib/tauri-api";
import { extname, formatBytes } from "@/lib/utils";
import type { LoadedFile } from "@/types";

interface MediaViewerProps {
  file: LoadedFile;
}

export function MediaViewer({ file }: MediaViewerProps) {
  const src = useMemo(() => convertFileSrc(file.path), [file.path]);
  const [error, setError] = useState<string | null>(null);

  const isVideo = VIDEO_EXTENSIONS.has(extname(file.name));

  return (
    <div className="bg-background flex h-full flex-col">
      <div className="border-border flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-muted-foreground flex items-center gap-2 text-xs">
          {isVideo ? <FileVideo className="size-3.5" /> : <FileAudio className="size-3.5" />}
          {file.name}
        </span>
        <span className="text-muted-foreground text-xs">{formatBytes(file.size)}</span>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <CircleAlert className="text-muted-foreground size-8" />
            <div>
              <p className="text-sm font-medium">Cannot play this file</p>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs">{error}</p>
            </div>
            <button
              onClick={() => openInDefaultApp(file.path)}
              className="border-border bg-background hover:bg-accent inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors"
            >
              <ExternalLink className="size-3.5" />
              Open with default app
            </button>
          </div>
        ) : isVideo ? (
          // biome-ignore lint/a11y/useMediaCaption: local media files have no sidecar caption tracks; user-provided files
          <video
            key={file.path}
            src={src}
            controls
            autoPlay
            onError={(e) => {
              const code = e.currentTarget.error?.code;
              setError(
                code === 4
                  ? `Source not supported or failed to load (code 4). Usually: codec missing (MKV/AVI/WMV on this OS) or the file could not be read.`
                  : `Failed to load or decode this file (code ${code ?? "?"}).`,
              );
            }}
            className="max-h-full max-w-full"
          />
        ) : (
          <div className="w-full max-w-xl">
            {/* biome-ignore lint/a11y/useMediaCaption: audio-only, no captions applicable */}
            <audio
              key={file.path}
              src={src}
              controls
              autoPlay
              onError={(e) => {
                const code = e.currentTarget.error?.code;
                setError(
                  code === 4
                    ? "Source not supported or failed to load (code 4). Usually: codec missing or the file could not be read."
                    : `Failed to load or decode this file (code ${code ?? "?"}).`,
                );
              }}
              className="w-full"
            />
            <p className="text-muted-foreground mt-3 text-center text-xs">{file.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
