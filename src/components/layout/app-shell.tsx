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

export function AppShell() {
  const sidebarVisible = useStore((s) => s.sidebarVisible);
  const sidebarWidth = useStore((s) => s.settings.sidebarWidth);
  const tabs = useStore((s) => s.tabs);
  const activeTabId = useStore((s) => s.activeTabId);
  const findOpen = useStore((s) => s.findOpen);
  const quickOpenOpen = useStore((s) => s.quickOpenOpen);
  const settingsOpen = useStore((s) => s.settingsOpen);
  const projectSearchOpen = useStore((s) => s.projectSearchOpen);

  const mainArea = (
    <div className="flex h-full flex-col bg-background">
      <Toolbar />
      {tabs.length > 0 && <TabBar />}
      <div className="relative flex-1 overflow-hidden border-border border-l">
        {findOpen && activeTabId && <FindBar />}
        {activeTabId ? <ViewerRouter /> : <WelcomeScreen />}
      </div>
      <StatusBar />
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
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize={sidebarWidth} minSize={180} maxSize={500}>
            <Sidebar />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>{mainArea}</ResizablePanel>
        </ResizablePanelGroup>
      )}
    </>
  );
}
