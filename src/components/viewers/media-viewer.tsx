import { useMemo, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { CircleAlert, ExternalLink, FileAudio, FileVideo } from "lucide-react";

import { openInDefaultApp } from "@/lib/tauri-api";
import { formatBytes } from "@/lib/utils";
import type { LoadedFile } from "@/types";

interface MediaViewerProps {
  file: LoadedFile;
}

export function MediaViewer({ file }: MediaViewerProps) {
  const src = useMemo(() => convertFileSrc(file.path), [file.path]);
  const [error, setError] = useState<string | null>(null);

  const isVideo = /\.(mp4|m4v|mov|webm|avi|mkv|flv|wmv|mpg|mpeg|ts|3gp)$/i.test(file.name);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-border border-b px-3 py-1.5">
        <span className="flex items-center gap-2 text-muted-foreground text-xs">
          {isVideo ? <FileVideo className="size-3.5" /> : <FileAudio className="size-3.5" />}
          {file.name}
        </span>
        <span className="text-muted-foreground text-xs">{formatBytes(file.size)}</span>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {error ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <CircleAlert className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Cannot play this file</p>
              <p className="mt-1 max-w-sm text-muted-foreground text-xs">{error}</p>
            </div>
            <button
              onClick={() => openInDefaultApp(file.path)}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 font-medium text-xs transition-colors hover:bg-accent"
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
                  ? "The audio/video codec is not supported by the built-in player (e.g. MKV, AVI, WMV)."
                  : "Failed to load or decode this file.",
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
                    ? "The audio codec is not supported by the built-in player."
                    : "Failed to load or decode this file.",
                );
              }}
              className="w-full"
            />
            <p className="mt-3 text-center text-muted-foreground text-xs">{file.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
