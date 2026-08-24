import {
  FilePlus,
  FolderOpen,
  Minus,
  Monitor,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Settings,
  Sun,
} from "lucide-react";

import { Button } from "@kumix/ui/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@kumix/ui/ui/tooltip";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { useStore } from "@/stores/app-store";
import type { Theme } from "@/types";

const THEME_ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function Toolbar() {
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const sidebarVisible = useStore((s) => s.sidebarVisible);
  const theme = useStore((s) => s.settings.theme);
  const updateSettings = useStore((s) => s.updateSettings);
  const fontSize = useStore((s) => s.settings.fontSize);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);

  const cycleTheme = () => {
    const order: Theme[] = ["light", "dark", "system"];
    const idx = order.indexOf(theme);
    updateSettings({ theme: order[(idx + 1) % order.length] });
  };

  const ThemeIcon = THEME_ICON[theme];
  const PanelIcon = sidebarVisible ? PanelLeftClose : PanelLeft;

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-border border-b bg-background/80 px-2.5 backdrop-blur-sm">
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
        <TooltipContent>Open Folder</TooltipContent>
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
        <TooltipContent>Open File</TooltipContent>
      </Tooltip>

      <div className="mx-1 h-5 w-px bg-border" />

      <div className="min-w-0 flex-1 overflow-hidden">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
        <button
          onClick={() => updateSettings({ fontSize: Math.max(fontSize - 1, 10) })}
          className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Decrease font size"
        >
          <Minus className="size-3" />
        </button>
        <span className="min-w-[2rem] text-center text-[11px] text-muted-foreground tabular-nums">
          {fontSize}
        </span>
        <button
          onClick={() => updateSettings({ fontSize: Math.min(fontSize + 1, 32) })}
          className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Increase font size"
        >
          <Plus className="size-3" />
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="icon" className="size-8" onClick={toggleSidebar} />}
        >
          <PanelIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Toggle Sidebar (Ctrl+B)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="icon" className="size-8" onClick={cycleTheme} />}
        >
          <ThemeIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Theme: {theme}</TooltipContent>
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
