import { useCallback, useEffect, useRef, useState } from "react";
import { CaseSensitive, FileText, Search, X } from "lucide-react";

import { Button } from "@kumix/ui/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@kumix/ui/ui/dialog";
import { Input } from "@kumix/ui/ui/input";
import { ScrollArea } from "@kumix/ui/ui/scroll-area";
import { type SearchMatch, searchInProject } from "@/lib/tauri-api";
import { basename } from "@/lib/utils";
import { useStore } from "@/stores/app-store";

export function ProjectSearch() {
  const open = useStore((s) => s.projectSearchOpen);
  const setOpen = useStore((s) => s.setProjectSearchOpen);
  const rootPath = useStore((s) => s.workspace.rootPath);
  const openFile = useStore((s) => s.openFile);

  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
      setResults([]);
      setSearched(false);
    }
  }, [open]);

  const doSearch = useCallback(async () => {
    if (!rootPath || !query.trim()) {
      setResults([]);
      setSearched(true);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const matches = await searchInProject(rootPath, query, caseSensitive);
      setResults(matches);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [rootPath, query, caseSensitive]);

  useEffect(() => {
    if (!open || !query.trim()) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSearch, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, doSearch]);

  const grouped = results.reduce<Map<string, SearchMatch[]>>((acc, m) => {
    if (!acc.has(m.path)) acc.set(m.path, []);
    acc.get(m.path)!.push(m);
    return acc;
  }, new Map());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      doSearch();
    }
  };

  const handleClickResult = (path: string) => {
    openFile(path);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton
        className="max-w-3xl gap-0 overflow-hidden rounded-xl border-border p-0"
      >
        <DialogTitle className="sr-only">Project Search</DialogTitle>
        <div className="flex items-center gap-2 border-border border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in project..."
            className="h-9 flex-1 border-0 shadow-none focus-visible:ring-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setCaseSensitive((v) => !v)}
            title="Match case"
          >
            <CaseSensitive className={`size-4 ${caseSensitive ? "text-primary" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setOpen(false)}
            title="Close (Esc)"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between border-border border-b px-4 py-2 text-muted-foreground text-xs">
          <span>
            {loading
              ? "Searching..."
              : searched
                ? `${results.length} result${results.length === 1 ? "" : "s"}`
                : "Type to search"}
          </span>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="py-1">
            {grouped.size === 0 && !loading && searched ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <p className="text-muted-foreground text-sm">No results found</p>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([filePath, matches]) => (
                <div key={filePath}>
                  <div className="flex items-center gap-2 border-border border-b bg-muted/30 px-4 py-1.5">
                    <FileText className="size-3 text-muted-foreground" />
                    <span className="font-mono text-muted-foreground text-xs">
                      {basename(filePath)}
                    </span>
                    <span className="text-muted-foreground/50 text-xs">
                      {matches.length} match{matches.length === 1 ? "" : "es"}
                    </span>
                  </div>
                  {matches.map((match, idx) => (
                    <button
                      key={`${match.line}-${idx}`}
                      onClick={() => handleClickResult(match.path)}
                      className="flex w-full items-baseline gap-3 px-4 py-1.5 text-left transition-colors hover:bg-accent"
                    >
                      <span className="min-w-[2.5rem] text-right font-mono text-muted-foreground/50 text-xs">
                        {match.line}
                      </span>
                      <span className="truncate font-mono text-xs">{match.text.trim()}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
