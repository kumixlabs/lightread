import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CaseSensitive, ChevronDown, ChevronUp, Replace, ReplaceAll, X } from "lucide-react";

import { Button } from "@kumix/ui/ui/button";
import { Input } from "@kumix/ui/ui/input";
import { cn, findMatches } from "@/lib/utils";
import { useStore } from "@/stores/app-store";

export function FindBar() {
  const findOpen = useStore((s) => s.findOpen);
  const setFindOpen = useStore((s) => s.setFindOpen);
  const findQuery = useStore((s) => s.findQuery);
  const setFindQuery = useStore((s) => s.setFindQuery);
  const findReplace = useStore((s) => s.findReplace);
  const caseSensitive = useStore((s) => s.findCaseSensitive);
  const setCaseSensitive = useStore((s) => s.setFindCaseSensitive);
  const currentIndex = useStore((s) => s.findIndex);
  const setCurrentIndex = useStore((s) => s.setFindIndex);
  const updateDraft = useStore((s) => s.updateDraft);
  const activeTabId = useStore((s) => s.activeTabId);
  const tabs = useStore((s) => s.tabs);

  const [replacement, setReplacement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const content = activeTab ? (activeTab.draft ?? activeTab.file.content) : "";
  // Replace works on the plain-text editing surface — every text-based viewer
  // (code/html/svg/csv source included) edits via updateDraft.
  const canReplace =
    !!activeTab &&
    !["image", "media", "unsupported"].includes(activeTab.file.viewerType) &&
    !activeTab.file.lossy &&
    !activeTab.file.truncated;

  // Skip per-keystroke full scans on huge content — they freeze the UI.
  const tooBig = content.length > 2_000_000;
  const matches = useMemo(
    () => (tooBig ? [] : findMatches(content, findQuery, caseSensitive)),
    [tooBig, findQuery, content, caseSensitive],
  );

  useEffect(() => {
    if (currentIndex >= matches.length) setCurrentIndex(0);
  }, [matches, currentIndex, setCurrentIndex]);

  useEffect(() => {
    if (findOpen) requestAnimationFrame(() => inputRef.current?.focus());
  }, [findOpen]);

  const scrollToMatch = useCallback(
    (idx: number) => {
      if (matches.length === 0) return;
      const clamped = ((idx % matches.length) + matches.length) % matches.length;
      const pos = matches[clamped];
      // Scope to the ACTIVE tab — keep-alive keeps hidden viewers mounted.
      const viewer = activeTabId
        ? (document
            .querySelector(`[data-tab="${CSS.escape(activeTabId)}"]`)
            ?.querySelector("[data-viewer-content]") ?? null)
        : document.querySelector("[data-viewer-content]");
      if (!viewer) return;
      const line = content.slice(0, pos).split("\n").length;
      const ta = viewer.querySelector("textarea");
      if (ta) {
        const lh = Number.parseFloat(getComputedStyle(ta).lineHeight) || 20;
        ta.scrollTop = Math.max(0, (line - 1) * lh + 16 - ta.clientHeight / 3);
        return;
      }
      const codeLine = viewer.querySelectorAll<HTMLElement>(".code-line")[line - 1];
      if (codeLine) {
        codeLine.scrollIntoView({ block: "center" });
        return;
      }
      // Media/other viewers: approximate ratio scroll.
      const total = viewer.scrollHeight;
      const ratio = content.length > 0 ? pos / content.length : 0;
      viewer.scrollTop = Math.min(ratio * total, total);
    },
    [matches, content, activeTabId],
  );

  const handleNext = () => {
    const next = currentIndex + 1;
    const wrapped = next >= matches.length ? 0 : next;
    setCurrentIndex(wrapped);
    scrollToMatch(wrapped);
  };

  const handlePrev = () => {
    const prev = currentIndex - 1;
    const wrapped = prev < 0 ? matches.length - 1 : prev;
    setCurrentIndex(wrapped);
    scrollToMatch(wrapped);
  };

  const handleClose = () => setFindOpen(false);

  const replaceCurrent = () => {
    if (!activeTabId || !canReplace || matches.length === 0) return;
    const pos = matches[Math.min(currentIndex, matches.length - 1)];
    const next = content.slice(0, pos) + replacement + content.slice(pos + findQuery.length);
    updateDraft(activeTabId, next);
  };

  const replaceAll = () => {
    if (!activeTabId || !canReplace || matches.length === 0) return;
    const flags = caseSensitive ? "g" : "gi";
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const next = content.replace(new RegExp(escaped, flags), replacement);
    updateDraft(activeTabId, next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) handlePrev();
      else handleNext();
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey || e.altKey) replaceAll();
      else replaceCurrent();
    }
  };

  if (!findOpen) return null;

  return (
    <div className="absolute top-3 right-3 z-30 flex animate-fade-in flex-col items-start gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-lg backdrop-blur">
      <div className="flex items-center gap-1">
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find"
            className={cn(
              "h-8 w-52 rounded-md border border-border bg-muted/50 pr-8 text-sm shadow-none focus-visible:ring-1",
              findQuery &&
                matches.length === 0 &&
                "border-destructive/40 bg-destructive/10 text-destructive focus-visible:ring-destructive/40",
            )}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 size-7"
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="Match case"
          >
            <CaseSensitive className={cn("size-4", caseSensitive && "text-primary")} />
          </Button>
        </div>

        <span
          className={cn(
            "min-w-15 px-1 text-center text-xs tabular-nums",
            findQuery && matches.length === 0 ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {matches.length > 0
            ? `${currentIndex + 1} of ${matches.length}`
            : findQuery
              ? tooBig
                ? "File too large"
                : "No results"
              : ""}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handlePrev}
          disabled={matches.length === 0}
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleNext}
          disabled={matches.length === 0}
          title="Next match (Enter)"
        >
          <ChevronDown className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleClose}
          title="Close (Esc)"
        >
          <X className="size-4" />
        </Button>
      </div>

      {findReplace && (
        <div className="flex items-center gap-1">
          <Input
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={handleReplaceKeyDown}
            placeholder={canReplace ? "Replace with" : "Read-only file"}
            disabled={!canReplace}
            className="h-8 w-52 rounded-md border border-border bg-muted/50 text-sm shadow-none focus-visible:ring-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={replaceCurrent}
            disabled={!canReplace || matches.length === 0}
            title="Replace"
          >
            <Replace className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={replaceAll}
            disabled={!canReplace || matches.length === 0}
            title="Replace all"
          >
            <ReplaceAll className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
