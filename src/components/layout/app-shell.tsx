import { useState } from "react";

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

function SidebarPane({ width, onResize }: { width: number; onResize: (px: number) => void }) {
  // Freeze initial width per mount: re-feeding a changing defaultSize while
  // dragging re-registers the panel and fights the resize gesture.
  const [initialWidth] = useState(width);
  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel
        defaultSize={initialWidth}
        minSize={250}
        maxSize={500}
        onResize={(size) => onResize(size.inPixels)}
      >
        <Sidebar />
      </ResizablePanel>
      <ResizableHandle />
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
  const settingsOpen = useStore((s) => s.settingsOpen);
  const projectSearchOpen = useStore((s) => s.projectSearchOpen);

  const mainArea = (
    <div className="flex h-full flex-col bg-background">
      <Toolbar />
      <TabsAndMain />
    </div>
  );

  return (
    <>
      {quickOpenOpen && <QuickOpen />}
      {settingsOpen && <SettingsDialog />}
      {projectSearchOpen && <ProjectSearch />}
      <UnsavedChangesDialog />
      {!sidebarVisible ? (
        mainArea
      ) : (
        <SidebarPane width={sidebarWidth} onResize={(px) => updateSettings({ sidebarWidth: px })} />
      )}
    </>
  );
}
