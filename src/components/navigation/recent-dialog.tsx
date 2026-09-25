import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Folder, Search, X } from "lucide-react";

import { Dialog, DialogContent } from "@kumix/ui/ui/dialog";
import { Input } from "@kumix/ui/ui/input";
import { cn } from "@/lib/utils";
import { useStore } from "@/stores/app-store";
import type { RecentEntry } from "@/types";

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t === q) return 1000;
  if (t.startsWith(q)) return 500;
  if (t.includes(q)) return 250;
  let qi = 0;
  let score = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 1;
      qi++;
    }
  }
  return qi === q.length ? score : -1;
}

export function RecentDialog() {
  const open = useStore((s) => s.recentOpen);
  const setOpen = useStore((s) => s.setRecentOpen);
  const recents = useStore((s) => s.recents);
  const openFolder = useStore((s) => s.openFolder);
  const openFile = useStore((s) => s.openFile);
  const removeRecent = useStore((s) => s.removeRecent);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const { dirs, files, allItems } = useMemo(() => {
    const list = !query.trim()
      ? recents
      : recents
          .map((entry) => ({
            entry,
            score: Math.max(fuzzyScore(query, entry.name), fuzzyScore(query, entry.path) - 10),
          }))
          .filter((i) => i.score >= 0)
          .sort((a, b) => b.score - a.score)
          .map((i) => i.entry);

    const d = list.filter((r) => r.isDir);
    const f = list.filter((r) => !r.isDir);
    return { dirs: d, files: f, allItems: [...d, ...f] };
  }, [recents, query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  };

  const select = useCallback(
    (item: RecentEntry | undefined) => {
      if (!item) return;
      if (item.isDir) {
        openFolder(item.path);
      } else {
        openFile(item.path);
      }
      setOpen(false);
    },
    [openFolder, openFile, setOpen],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      removeRecent(path);
      setSelectedIndex((prev) => Math.max(0, Math.min(prev, allItems.length - 2)));
    },
    [removeRecent, allItems.length],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(allItems[Math.min(selectedIndex, allItems.length - 1)]);
    } else if (e.key === "Delete" && (e.shiftKey || e.altKey)) {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        removeRecent(current.path);
        setSelectedIndex((prev) => Math.max(0, Math.min(prev, allItems.length - 2)));
      }
    }
  };

  const renderItem = (item: RecentEntry, globalIdx: number) => {
    const Icon = item.isDir ? Folder : FileText;
    const isSelected = globalIdx === selectedIndex;
    return (
      <div
        key={item.path}
        onMouseEnter={() => setSelectedIndex(globalIdx)}
        className={cn(
          "group flex w-full items-center justify-between rounded-lg pr-2 transition-colors",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent",
        )}
      >
        <button
          type="button"
          onClick={() => select(item)}
          title={item.path}
          className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-sm"
        >
          <Icon
            className={cn("size-4 shrink-0", item.isDir ? "text-primary" : "text-muted-foreground")}
          />
          <span className={cn("truncate font-medium", isSelected && "text-primary")}>
            {item.name}
          </span>
          <span className="truncate text-muted-foreground text-xs">{item.path}</span>
        </button>
        <button
          type="button"
          title="Remove from recents"
          onClick={(e) => handleRemove(e, item.path)}
          className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background/80 hover:text-foreground group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-0 overflow-hidden rounded-xl border-border p-0 shadow-2xl sm:max-w-2xl [&>button]:hidden">
        <div className="flex items-center gap-2.5 border-border border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search recent projects and files... (Ctrl+R)"
            className="h-6 border-0 px-0 text-base shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-120 overflow-y-auto p-2">
          {allItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No matching recent projects or files
            </div>
          ) : (
            <>
              {dirs.length > 0 && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 px-3 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
                    <Folder className="size-3" />
                    <span>Projects & Folders</span>
                  </div>
                  {dirs.map((item, idx) => renderItem(item, idx))}
                </div>
              )}

              {dirs.length > 0 && files.length > 0 && (
                <div className="my-2 border-border border-t" />
              )}

              {files.length > 0 && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 px-3 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
                    <FileText className="size-3" />
                    <span>Files</span>
                  </div>
                  {files.map((item, idx) => renderItem(item, dirs.length + idx))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
