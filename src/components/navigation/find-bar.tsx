import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CaseSensitive, ChevronDown, ChevronUp, Replace, ReplaceAll, X } from "lucide-react";

import { Button } from "@kumix/ui/ui/button";
import { Input } from "@kumix/ui/ui/input";
import { cn } from "@/lib/utils";
import { useStore } from "@/stores/app-store";
import { isEditable } from "@/types";

export function FindBar() {
  const findOpen = useStore((s) => s.findOpen);
  const setFindOpen = useStore((s) => s.setFindOpen);
  const findQuery = useStore((s) => s.findQuery);
  const setFindQuery = useStore((s) => s.setFindQuery);
  const findReplace = useStore((s) => s.findReplace);
  const updateDraft = useStore((s) => s.updateDraft);
  const activeTabId = useStore((s) => s.activeTabId);
  const tabs = useStore((s) => s.tabs);

  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [replacement, setReplacement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const content = activeTab ? (activeTab.draft ?? activeTab.file.content) : "";
  const canReplace =
    !!activeTab &&
    isEditable(activeTab.file.viewerType) &&
    !activeTab.file.lossy &&
    !activeTab.file.truncated;

  const matches = useMemo(() => {
    if (!findQuery || !content) return [];
    const flags = caseSensitive ? "g" : "gi";
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, flags);
    const result: number[] = [];
    let m = regex.exec(content);
    while (m !== null) {
      result.push(m.index);
      if (m.index === regex.lastIndex) regex.lastIndex++;
      m = regex.exec(content);
    }
    return result;
  }, [findQuery, content, caseSensitive]);

  useEffect(() => {
    if (currentIndex >= matches.length) setCurrentIndex(0);
  }, [matches, currentIndex]);

  useEffect(() => {
    if (findOpen) requestAnimationFrame(() => inputRef.current?.focus());
  }, [findOpen]);

  const scrollToMatch = useCallback(
    (idx: number) => {
      if (matches.length === 0) return;
      const clamped = ((idx % matches.length) + matches.length) % matches.length;
      const pos = matches[clamped];
      const viewer = document.querySelector("[data-viewer-content]");
      if (viewer) {
        const total = viewer.scrollHeight;
        const ratio = content.length > 0 ? pos / content.length : 0;
        viewer.scrollTop = Math.min(ratio * total, total);
      }
    },
    [matches, content.length],
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

  if (!findOpen) return null;

  return (
    <div className="absolute top-3 right-3 z-30 flex animate-fade-in flex-col items-end gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-lg backdrop-blur">
      <div className="flex items-center gap-1">
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find"
            className="h-8 w-52 border-0 pr-8 text-sm shadow-none focus-visible:ring-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 size-7"
            onClick={() => setCaseSensitive((v) => !v)}
            title="Match case"
          >
            <CaseSensitive className={cn("size-4", caseSensitive && "text-primary")} />
          </Button>
        </div>

        <span className="min-w-[60px] px-1 text-center text-muted-foreground text-xs tabular-nums">
          {matches.length > 0
            ? `${currentIndex + 1} of ${matches.length}`
            : findQuery
              ? "No results"
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
            placeholder={canReplace ? "Replace with" : "Read-only file"}
            disabled={!canReplace}
            className="h-8 w-52 border-0 text-sm shadow-none focus-visible:ring-1"
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
