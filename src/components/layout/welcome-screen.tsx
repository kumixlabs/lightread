import { BookOpen, Clock, FilePlus, FileText, Folder, FolderOpen } from "lucide-react";

import { Button } from "@kumix/ui/ui/button";
import { useStore } from "@/stores/app-store";

const lr = () => window.__lightread;

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "Ctrl+O", label: "Open File" },
  { keys: "Ctrl+Shift+O", label: "Open Folder" },
  { keys: "Ctrl+P", label: "Quick Open" },
  { keys: "Ctrl+B", label: "Toggle Sidebar" },
  { keys: "Ctrl+F", label: "Find in File" },
  { keys: "Ctrl+S", label: "Save" },
  { keys: "Ctrl+Shift+S", label: "Save As" },
  { keys: "Ctrl+H", label: "Find & Replace" },
  { keys: "Ctrl+Shift+V", label: "Markdown Preview" },
  { keys: "Ctrl+W", label: "Close Tab" },
  { keys: "Ctrl+Tab", label: "Next Tab" },
  { keys: "Ctrl+= / -", label: "Font Size" },
];

export function WelcomeScreen() {
  const recents = useStore((s) => s.recents);
  const openFile = useStore((s) => s.openFile);
  const openFolder = useStore((s) => s.openFolder);

  const recentDirs = recents.filter((r) => r.isDir).slice(0, 5);
  const recentFiles = recents.filter((r) => !r.isDir).slice(0, 5);
  const hasRecents = recentDirs.length > 0 || recentFiles.length > 0;

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-auto bg-gradient-to-b from-background to-muted/30 p-8">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <BookOpen className="size-7 text-primary" />
        </div>
      </div>
      <h1 className="font-bold text-4xl tracking-tight">LightRead</h1>
      <p className="mt-1.5 text-base text-muted-foreground">Read. Edit. Preview. Nothing Else.</p>

      <div className="mt-8 flex gap-2.5">
        <Button size="lg" className="h-10 px-5" onClick={() => lr()?.openFile()}>
          <FilePlus className="size-4" />
          Open File
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-10 px-5"
          onClick={() => lr()?.openFolder()}
        >
          <FolderOpen className="size-4" />
          Open Folder
        </Button>
      </div>

      <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-8 md:grid-cols-3">
        {hasRecents && (
          <>
            {recentDirs.length > 0 && (
              <div>
                <h3 className="mb-2.5 flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  <Folder className="size-3.5" />
                  Recent Projects
                </h3>
                <div className="space-y-0.5">
                  {recentDirs.map((r) => (
                    <button
                      key={r.path}
                      onClick={() => openFolder(r.path)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors hover:bg-accent"
                    >
                      <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-left">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {recentFiles.length > 0 && (
              <div>
                <h3 className="mb-2.5 flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  <FileText className="size-3.5" />
                  Recent Files
                </h3>
                <div className="space-y-0.5">
                  {recentFiles.map((r) => (
                    <button
                      key={r.path}
                      onClick={() => openFile(r.path)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors hover:bg-accent"
                    >
                      <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-left">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className={hasRecents ? "" : "md:col-span-3"}>
          <h3 className="mb-2.5 flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            <Clock className="size-3.5" />
            Shortcuts
          </h3>
          <div className="space-y-1">
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">{s.label}</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
