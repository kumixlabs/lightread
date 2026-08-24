import { useEffect, useLayoutEffect, useRef } from "react";
import {
  Braces,
  FileCode2,
  FileImage,
  FileText,
  FileWarning,
  Globe,
  type LucideIcon,
  Plus,
  X,
} from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@kumix/ui/ui/context-menu";
import { ScrollArea, ScrollBar } from "@kumix/ui/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@kumix/ui/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStore } from "@/stores/app-store";
import type { LoadedFile } from "@/types";

function getFileIcon(file: LoadedFile): LucideIcon {
  const ext = file.extension.toLowerCase();
  if ([".json", ".jsonc"].includes(ext)) return Braces;
  switch (file.viewerType) {
    case "code":
      return FileCode2;
    case "markdown":
    case "text":
      return FileText;
    case "image":
    case "svg":
      return FileImage;
    case "html":
      return Globe;
    case "unsupported":
      return FileWarning;
    default:
      return FileCode2;
  }
}

export function TabBar() {
  const tabs = useStore((s) => s.tabs);
  const activeTabId = useStore((s) => s.activeTabId);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const closeTab = useStore((s) => s.closeTab);
  const closeOtherTabs = useStore((s) => s.closeOtherTabs);
  const closeAllTabs = useStore((s) => s.closeAllTabs);

  const scrollerRef = useRef<HTMLElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  // Keep the active tab visible when switching tabs (VS Code behavior).
  // biome-ignore lint/correctness/useExhaustiveDependencies: activeTabId triggers the scroll on tab switch
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const active = el?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (el && active) {
      const left = active.offsetLeft;
      const right = left + active.offsetWidth;
      if (left < el.scrollLeft) el.scrollTo({ left: left - 8, behavior: "smooth" });
      else if (right > el.scrollLeft + el.clientWidth)
        el.scrollTo({ left: right - el.clientWidth + 8, behavior: "smooth" });
    }
  }, [activeTabId]);

  // Hover the tab bar + mouse wheel = horizontal tab scrolling (VS Code style).
  useEffect(() => {
    const root = scrollAreaRef.current;
    if (!root) return;
    const vp = root.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]") ?? root;
    scrollerRef.current = vp;
    const onWheel = (e: WheelEvent) => {
      if (vp.scrollWidth <= vp.clientWidth) return; // nothing to scroll
      e.preventDefault();
      vp.scrollLeft += e.deltaY + e.deltaX;
    };
    root.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => root.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  if (tabs.length === 0) return null;

  return (
    <div className="flex h-9 shrink-0 items-stretch border-border border-b bg-muted/40">
      <div ref={scrollAreaRef} className="min-w-0 flex-1">
        <ScrollArea className="h-9">
          <div className="flex items-stretch">
            {tabs.map((tab) => {
              const Icon = getFileIcon(tab.file);
              const isActive = tab.id === activeTabId;
              const isDirty = tab.draft !== undefined && tab.draft !== tab.file.content;
              return (
                <ContextMenu key={tab.id}>
                  <ContextMenuTrigger
                    render={
                      <div
                        role="tab"
                        tabIndex={0}
                        aria-selected={isActive}
                        onClick={() => setActiveTab(tab.id)}
                        onMouseDown={(e) => {
                          if (e.button === 1) {
                            e.preventDefault();
                            closeTab(tab.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveTab(tab.id);
                          }
                        }}
                        className={cn(
                          "group relative flex h-9 min-w-0 shrink-0 cursor-pointer items-center gap-2 border-border border-r px-3 text-[13px] transition-all",
                          isActive
                            ? "bg-background text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      />
                    }
                  >
                    {isActive && <span className="absolute inset-x-0 top-0 h-0.5 bg-primary" />}
                    <Icon
                      className={cn("size-3.5 shrink-0", isActive ? "text-primary" : "opacity-70")}
                    />
                    <span className="truncate">{tab.file.name}</span>
                    {isDirty && (
                      <span
                        className="ml-1 inline-block size-1.5 shrink-0 rounded-full bg-primary"
                        aria-label="Unsaved changes"
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      className={cn(
                        "ml-auto inline-flex size-4 shrink-0 items-center justify-center rounded transition-all",
                        isActive
                          ? "opacity-60 hover:bg-accent hover:opacity-100"
                          : "opacity-0 hover:bg-accent group-hover:opacity-60 group-hover:hover:opacity-100",
                      )}
                      aria-label="Close tab"
                    >
                      <X className="size-3" />
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => closeTab(tab.id)}>Close</ContextMenuItem>
                    <ContextMenuItem onClick={() => closeOtherTabs(tab.id)}>
                      Close Others
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => closeAllTabs()}>Close All</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={() => window.__lightread?.openFile()}
              className="flex w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label="Open file (Ctrl+O)"
            />
          }
        >
          <Plus className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Open File (Ctrl+O)</TooltipContent>
      </Tooltip>
    </div>
  );
}
