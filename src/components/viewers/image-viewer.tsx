import { useCallback, useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Maximize, Minimize, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

import { cn, formatBytes } from "@/lib/utils";
import type { LoadedFile } from "@/types";

interface ImageViewerProps {
  file: LoadedFile;
}

export function ImageViewer({ file }: ImageViewerProps) {
  const src = convertFileSrc(file.path);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [userZoomed, setUserZoomed] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const fitToWindow = useCallback(() => {
    if (!containerRef.current || !dims) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const scale = Math.min(cw / dims.w, ch / dims.h, 1);
    setZoom(scale);
    setOffset({ x: 0, y: 0 });
  }, [dims]);

  const handleLoad = () => {
    setLoading(false);
    if (imgRef.current) {
      setDims({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  useEffect(() => {
    if (!loading && dims && !userZoomed) {
      fitToWindow();
    }
  }, [loading, dims, userZoomed, fitToWindow]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setDragging(false);

  const zoomIn = () => {
    setUserZoomed(true);
    setZoom((z) => Math.min(z * 1.25, 10));
  };
  const zoomOut = () => {
    setUserZoomed(true);
    setZoom((z) => Math.max(z / 1.25, 0.1));
  };
  const actualSize = () => {
    setUserZoomed(true);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  const reset = () => {
    setUserZoomed(false);
    fitToWindow();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between gap-2 border-border border-b px-3 py-1.5">
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="min-w-[3rem] text-center text-muted-foreground text-xs tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-border" />
          <button
            onClick={actualSize}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Actual size"
          >
            <Minimize className="size-4" />
          </button>
          <button
            onClick={reset}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Fit to window"
          >
            <Maximize className="size-4" />
          </button>
          <button
            onClick={reset}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Reset"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
        <span className="text-muted-foreground text-xs">
          {dims ? `${dims.w} \u00D7 ${dims.h} px` : ""}
          {dims ? " \u00B7 " : ""}
          {formatBytes(file.size)}
        </span>
      </div>
      <div
        ref={containerRef}
        className={cn(
          "relative flex flex-1 items-center justify-center overflow-hidden",
          zoom > 1 && (dragging ? "cursor-grabbing" : "cursor-grab"),
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
        {error ? (
          <div className="text-muted-foreground text-sm">Failed to load image</div>
        ) : (
          <img
            ref={imgRef}
            src={src}
            alt={file.name}
            onLoad={handleLoad}
            onError={handleError}
            draggable={false}
            className="max-w-none select-none"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transition: dragging ? "none" : "transform 0.15s ease-out",
              visibility: loading ? "hidden" : "visible",
            }}
          />
        )}
      </div>
    </div>
  );
}
