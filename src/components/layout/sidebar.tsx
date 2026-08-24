import {
  BookOpenText,
  ChevronsDownUp,
  ChevronsUpDown,
  FolderOpen,
  FolderX,
  RefreshCw,
  Search,
} from "lucide-react";

import { Badge } from "@kumix/ui/ui/badge";
import { Button } from "@kumix/ui/ui/button";
import { Input } from "@kumix/ui/ui/input";
import { ScrollArea } from "@kumix/ui/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@kumix/ui/ui/tooltip";
import { FileTree } from "@/components/explorer/file-tree";
import { useStore } from "@/stores/app-store";

const lr = () => window.__lightread;

export function Sidebar() {
  const rootPath = useStore((s) => s.workspace.rootPath);
  const fileSearch = useStore((s) => s.fileSearch);
  const setFileSearch = useStore((s) => s.setFileSearch);
  const refreshTree = useStore((s) => s.refreshTree);
  const expandAll = useStore((s) => s.expandAll);
  const expandedDirs = useStore((s) => s.expandedDirs);

  const hasFolder = !!rootPath;

  const collapsed = expandedDirs.size === 0;
  const collapseAll = () => {
    useStore.setState({ expandedDirs: new Set<string>() });
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-11 shrink-0 items-center gap-2 border-sidebar-border border-b px-2.5">
        <BookOpenText className="size-5 shrink-0 text-primary" />
        <span className="truncate font-semibold text-sm">
          Light<span className="text-primary">Read</span>
        </span>
        <span className="flex-1" />
        <Badge variant="secondary" className="px-1.5 text-[10px]">
          v{__APP_VERSION__}
        </Badge>
      </div>

      {hasFolder && (
        <div className="flex items-center gap-1 border-sidebar-border border-b px-2.5 py-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder="Search files..."
              className="h-8 border-sidebar-border bg-background/50 pr-2 pl-8 text-xs"
            />
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  onClick={refreshTree}
                />
              }
            >
              <RefreshCw className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Refresh</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  onClick={() => (collapsed ? void expandAll() : collapseAll())}
                />
              }
            >
              {collapsed ? (
                <ChevronsUpDown className="size-3.5" />
              ) : (
                <ChevronsDownUp className="size-3.5" />
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {collapsed ? "Expand All" : "Collapse All"}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {hasFolder ? (
        <ScrollArea className="min-h-0 flex-1">
          <FileTree />
        </ScrollArea>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-sidebar-accent">
            <FolderX className="size-8 text-muted-foreground/60" />
          </div>
          <div>
            <p className="font-medium text-sm">No folder open</p>
            <p className="mt-0.5 text-muted-foreground text-xs">Open a folder to browse files</p>
          </div>
          <Button variant="outline" size="sm" className="mt-1" onClick={() => lr()?.openFolder()}>
            <FolderOpen className="size-4" />
            Open Folder
          </Button>
        </div>
      )}
    </div>
  );
}
