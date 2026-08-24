import {
  ChevronsDownUp,
  FilePlus,
  FolderOpen,
  FolderX,
  PanelLeftClose,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react";

import { Button } from "@kumix/ui/ui/button";
import { Input } from "@kumix/ui/ui/input";
import { ScrollArea } from "@kumix/ui/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@kumix/ui/ui/tooltip";
import { FileTree } from "@/components/explorer/file-tree";
import { useStore } from "@/stores/app-store";

const lr = () => window.__lightread;

export function Sidebar() {
  const rootName = useStore((s) => s.workspace.rootName);
  const rootPath = useStore((s) => s.workspace.rootPath);
  const fileSearch = useStore((s) => s.fileSearch);
  const setFileSearch = useStore((s) => s.setFileSearch);
  const refreshTree = useStore((s) => s.refreshTree);
  const expandedDirs = useStore((s) => s.expandedDirs);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);

  const hasFolder = !!rootPath;

  const collapseAll = () => {
    useStore.setState({ expandedDirs: new Set<string>() });
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between gap-1 border-sidebar-border border-b px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <FolderOpen className="size-3.5 text-primary" />
          </div>
          <span className="truncate font-semibold text-sm">
            {hasFolder ? rootName : "Explorer"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  onClick={() => lr()?.openFile()}
                />
              }
            >
              <FilePlus className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Open File</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  onClick={() => lr()?.openFolder()}
                />
              }
            >
              <FolderOpen className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Open Folder</TooltipContent>
          </Tooltip>
          {hasFolder && (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
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
                      className="size-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                      onClick={collapseAll}
                      disabled={expandedDirs.size === 0}
                    />
                  }
                >
                  <ChevronsDownUp className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Collapse All</TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  onClick={toggleSidebar}
                />
              }
            >
              <PanelLeftClose className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Close Sidebar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {hasFolder && (
        <div className="border-sidebar-border border-b px-2.5 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder="Search files..."
              className="h-8 border-sidebar-border bg-background/50 pl-8 text-xs"
            />
          </div>
        </div>
      )}

      {hasFolder ? (
        <ScrollArea className="flex-1">
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

      <div className="flex shrink-0 items-center gap-0.5 border-sidebar-border border-t px-2 py-1.5">
        <span className="flex-1 px-1 text-[10px] text-muted-foreground/80 uppercase tracking-wide">
          LightRead
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                onClick={() => setSettingsOpen(true)}
              />
            }
          >
            <Settings className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="top">Settings</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
