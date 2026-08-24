import { FilePlus, FolderOpen, PanelLeft, PanelLeftClose, Settings } from "lucide-react";

import { Button } from "@kumix/ui/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@kumix/ui/ui/tooltip";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { useStore } from "@/stores/app-store";

export function Toolbar() {
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const sidebarVisible = useStore((s) => s.sidebarVisible);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);

  const PanelIcon = sidebarVisible ? PanelLeftClose : PanelLeft;

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-border border-b bg-background/80 px-2.5 backdrop-blur-sm">
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="icon" className="size-8" onClick={toggleSidebar} />}
        >
          <PanelIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Toggle Sidebar (Ctrl+B)</TooltipContent>
      </Tooltip>

      <div className="min-w-0 flex-1 overflow-hidden">
        <Breadcrumbs />
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => window.__lightread?.openFolder()}
            />
          }
        >
          <FolderOpen className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Open Folder (Ctrl+Shift+O)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => window.__lightread?.openFile()}
            />
          }
        >
          <FilePlus className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Open File (Ctrl+O)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setSettingsOpen(true)}
            />
          }
        >
          <Settings className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Settings (Ctrl+,)</TooltipContent>
      </Tooltip>
    </div>
  );
}
