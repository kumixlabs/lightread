import {
  Braces,
  FileCode2,
  FileImage,
  FileText,
  FileWarning,
  Globe,
  type LucideIcon,
  X,
} from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@kumix/ui/ui/context-menu";
import { ScrollArea, ScrollBar } from "@kumix/ui/ui/scroll-area";
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

  if (tabs.length === 0) return null;

  return (
    <div className="flex h-9 items-stretch border-border border-b bg-muted/40">
      <ScrollArea className="h-full flex-1">
        <div className="flex h-9 items-stretch">
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
                        "group relative flex h-9 min-w-0 max-w-[200px] cursor-pointer items-center gap-2 border-border border-r px-3 text-[13px] transition-all",
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
