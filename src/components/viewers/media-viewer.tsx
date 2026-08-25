import { useMemo, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { CircleAlert, FileAudio, FileVideo } from "lucide-react";

import { formatBytes } from "@/lib/utils";
import type { LoadedFile } from "@/types";

interface MediaViewerProps {
  file: LoadedFile;
}

export function MediaViewer({ file }: MediaViewerProps) {
  const src = useMemo(() => convertFileSrc(file.path), [file.path]);
  const [error, setError] = useState(false);

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
          <div className="flex flex-col items-center gap-2 text-center">
            <CircleAlert className="size-8 text-muted-foreground" />
            <p className="font-medium text-sm">Cannot play this file</p>
            <p className="text-muted-foreground text-xs">
              The codec is not supported by the built-in player.
            </p>
          </div>
        ) : isVideo ? (
          <video
            key={file.path}
            src={src}
            controls
            autoPlay
            onError={() => setError(true)}
            className="max-h-full max-w-full"
          />
        ) : (
          <div className="w-full max-w-xl">
            <audio
              key={file.path}
              src={src}
              controls
              autoPlay
              onError={() => setError(true)}
              className="w-full"
            />
            <p className="mt-3 text-center text-muted-foreground text-xs">{file.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
