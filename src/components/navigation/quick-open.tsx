import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Dialog, DialogContent } from "@kumix/ui/ui/dialog";
import { Input } from "@kumix/ui/ui/input";
import { cn } from "@/lib/utils";
import { useStore } from "@/stores/app-store";
import type { FileNode } from "@/types";

function flattenTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  const walk = (list: FileNode[]) => {
    for (const node of list) {
      if (node.isDir) {
        if (node.children) walk(node.children);
      } else {
        result.push(node);
      }
    }
  };
  walk(nodes);
  return result;
}

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

export function QuickOpen() {
  const open = useStore((s) => s.quickOpenOpen);
  const setOpen = useStore((s) => s.setQuickOpenOpen);
  const tree = useStore((s) => s.workspace.tree);
  const rootPath = useStore((s) => s.workspace.rootPath);
  const rootName = useStore((s) => s.workspace.rootName);
  const recents = useStore((s) => s.recents);
  const openFile = useStore((s) => s.openFile);

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

  const items = useMemo(() => {
    if (rootPath && tree.length > 0) {
      return flattenTree(tree).map((f) => ({
        path: f.path,
        name: f.name,
        relPath: rootName
          ? f.path
              .replace(/\\/g, "/")
              .replace(`${rootPath.replace(/\\/g, "/").replace(/\/$/, "")}/`, "")
          : f.name,
      }));
    }
    return recents
      .filter((r) => !r.isDir)
      .map((r) => ({ path: r.path, name: r.name, relPath: r.name }));
  }, [tree, rootPath, rootName, recents]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 50);
    return items
      .map((i) => ({
        ...i,
        score: Math.max(fuzzyScore(query, i.name), fuzzyScore(query, i.relPath) - 10),
      }))
      .filter((i) => i.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, []);

  const select = useCallback(
    (item: { path: string } | undefined) => {
      if (!item) return;
      openFile(item.path);
      setOpen(false);
    },
    [openFile, setOpen],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(filtered[selectedIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-xl border-border p-0 shadow-2xl [&>button]:hidden">
        <div className="flex items-center gap-2.5 border-border border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={rootPath ? "Search files by name..." : "Recent files..."}
            className="h-6 border-0 px-0 text-base shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-100 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No matching files
            </div>
          )}
          {filtered.map((item, idx) => (
            <button
              key={item.path}
              onClick={() => select(item)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                idx === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-accent",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  idx === selectedIndex ? "bg-primary" : "bg-transparent",
                )}
              />
              <span className={cn("truncate font-medium", idx === selectedIndex && "text-primary")}>
                {item.name}
              </span>
              {item.relPath !== item.name && (
                <span className="ml-auto shrink-0 truncate pl-2 text-muted-foreground text-xs">
                  {item.relPath}
                </span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
