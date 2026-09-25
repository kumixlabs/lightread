import { useEffect, useRef } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";

import { Button } from "@kumix/ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@kumix/ui/ui/dialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@kumix/ui/ui/resizable";
import { Sidebar } from "@/components/layout/sidebar";
import { StatusBar } from "@/components/layout/status-bar";
import { WelcomeScreen } from "@/components/layout/welcome-screen";
import { FindBar } from "@/components/navigation/find-bar";
import { ProjectSearch } from "@/components/navigation/project-search";
import { QuickOpen } from "@/components/navigation/quick-open";
import { RecentDialog } from "@/components/navigation/recent-dialog";
import { Toolbar } from "@/components/navigation/toolbar";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { TabBar } from "@/components/tabs/tab-bar";
import { ViewerRouter } from "@/components/viewers/viewer-router";
import { useStore } from "@/stores/app-store";

function UnsavedChangesDialog() {
  const pendingClose = useStore((s) => s.pendingClose);
  const resolvePendingClose = useStore((s) => s.resolvePendingClose);
  const tabs = useStore((s) => s.tabs);
  if (!pendingClose) return null;
  const names = pendingClose.tabIds
    .map((id) => tabs.find((t) => t.id === id)?.file.name)
    .filter(Boolean) as string[];

  return (
    <Dialog open onOpenChange={(o) => !o && resolvePendingClose("cancel")}>
      <DialogContent showCloseButton={false} className="max-w-sm rounded-xl border-border p-0">
        <DialogTitle className="px-5 pt-5 font-semibold text-base">Unsaved changes</DialogTitle>
        <DialogDescription className="px-5 pt-1.5 pb-2 text-muted-foreground text-sm">
          {names.length === 1
            ? `Save changes to ${names[0]} before closing?`
            : `Save changes to ${names.length} files before closing?`}
        </DialogDescription>
        <DialogFooter className="flex-row gap-2 border-border border-t px-5 py-4">
          <Button variant="outline" size="sm" onClick={() => resolvePendingClose("cancel")}>
            Cancel
          </Button>
          <Button variant="ghost" size="sm" onClick={() => resolvePendingClose("discard")}>
            Don't save
          </Button>
          <Button size="sm" onClick={() => resolvePendingClose("save")}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SidebarPane({
  visible,
  width,
  onResize,
}: {
  visible: boolean;
  width: number;
  onResize: (px: number) => void;
}) {
  const panelRef = useRef<PanelImperativeHandle | null>(null);
  const clampedWidth = Math.min(600, Math.max(200, width || 260));

  // Sync panel size if store settings change (e.g. disk load or settings reset)
  useEffect(() => {
    if (panelRef.current) {
      const current = panelRef.current.getSize().inPixels;
      if (Math.abs(current - clampedWidth) > 2) {
        panelRef.current.resize(clampedWidth);
      }
    }
  }, [clampedWidth]);

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      onLayoutChanged={(_layout, meta) => {
        // Save layout only when user directly moves or releases the separator
        if (meta.isUserInteraction && panelRef.current) {
          const px = panelRef.current.getSize().inPixels;
          if (px > 0) {
            onResize(Math.round(px));
          }
        }
      }}
    >
      {visible && (
        <>
          <ResizablePanel
            panelRef={panelRef}
            defaultSize={clampedWidth}
            minSize={200}
            maxSize={600}
            groupResizeBehavior="preserve-pixel-size"
          >
            <Sidebar />
          </ResizablePanel>
          <ResizableHandle />
        </>
      )}
      <ResizablePanel>
        <div className="flex h-full flex-col bg-background">
          <Toolbar />
          <TabsAndMain />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function TabsAndMain() {
  const tabs = useStore((s) => s.tabs);
  const activeTabId = useStore((s) => s.activeTabId);
  const findOpen = useStore((s) => s.findOpen);
  return (
    <>
      {tabs.length > 0 && <TabBar />}
      <div className="relative flex-1 overflow-hidden">
        {findOpen && activeTabId && <FindBar />}
        {activeTabId ? <ViewerRouter /> : <WelcomeScreen />}
      </div>
      <StatusBar />
    </>
  );
}

export function AppShell() {
  const sidebarVisible = useStore((s) => s.sidebarVisible);
  const sidebarWidth = useStore((s) => s.settings.sidebarWidth);
  const updateSettings = useStore((s) => s.updateSettings);
  const quickOpenOpen = useStore((s) => s.quickOpenOpen);
  const recentOpen = useStore((s) => s.recentOpen);
  const settingsOpen = useStore((s) => s.settingsOpen);
  const projectSearchOpen = useStore((s) => s.projectSearchOpen);

  return (
    <>
      {quickOpenOpen && <QuickOpen />}
      {recentOpen && <RecentDialog />}
      {settingsOpen && <SettingsDialog />}
      {projectSearchOpen && <ProjectSearch />}
      <UnsavedChangesDialog />
      <SidebarPane
        visible={sidebarVisible}
        width={sidebarWidth}
        onResize={(px) => updateSettings({ sidebarWidth: px })}
      />
    </>
  );
}
