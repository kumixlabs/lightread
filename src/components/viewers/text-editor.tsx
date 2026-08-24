import { useCallback, useEffect, useMemo, useRef } from "react";

import { cn, findMatches } from "@/lib/utils";
import { useStore } from "@/stores/app-store";

interface TextEditorProps {
  tabId: string;
  content: string;
  onCursor?: (line: number, col: number) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * Plain notepad-style editing surface. No fancy features — that is the point.
 * The only flourish: find-bar matches are highlighted via a transparent-text
 * overlay layer synced to the textarea (textareas cannot style substrings).
 */
export function TextEditor({ tabId, content, onCursor, readOnly, className }: TextEditorProps) {
  const updateDraft = useStore((s) => s.updateDraft);
  const fontSize = useStore((s) => s.settings.fontSize);
  const lineHeight = useStore((s) => s.settings.lineHeight);
  const wordWrap = useStore((s) => s.settings.wordWrap);
  const findOpen = useStore((s) => s.findOpen);
  const findQuery = useStore((s) => s.findQuery);
  const caseSensitive = useStore((s) => s.findCaseSensitive);
  const findIndex = useStore((s) => s.findIndex);
  const ref = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // ponytail: skip highlight overlay for huge contents (regex + DOM cost);
  // if it ever matters, highlight only the visible viewport.
  const showHighlight = findOpen && !!findQuery && content.length < 500_000;
  const matches = useMemo(
    () => (showHighlight ? findMatches(content, findQuery, caseSensitive) : []),
    [showHighlight, content, findQuery, caseSensitive],
  );

  const reportCursor = useCallback(() => {
    const el = ref.current;
    if (!el || !onCursor) return;
    const upto = el.value.slice(0, el.selectionStart);
    const lines = upto.split("\n");
    onCursor(lines.length, lines[lines.length - 1].length + 1);
  }, [onCursor]);

  useEffect(() => {
    reportCursor();
  }, [reportCursor]);

  // Native undo/redo must survive external content swaps (tab switches reuse
  // this component via keys, so a mount-focus is enough).
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab inserts 2 spaces (notepad-like, keeps focus).
    if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !readOnly) {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: en } = el;
      const next = `${el.value.slice(0, s)}  ${el.value.slice(en)}`;
      updateDraft(tabId, next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = s + 2;
      });
    }
  };

  // Keep the highlight layer aligned with the textarea viewport.
  const syncScroll = useCallback(() => {
    const ta = ref.current;
    const hl = highlightRef.current;
    if (ta && hl) {
      hl.scrollTop = ta.scrollTop;
      hl.scrollLeft = ta.scrollLeft;
    }
  }, []);

  let highlightBody: React.ReactNode = null;
  if (matches.length > 0) {
    const nodes: React.ReactNode[] = [];
    let last = 0;
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i];
      const end = start + findQuery.length;
      if (start > last) nodes.push(content.slice(last, start));
      nodes.push(
        <mark
          key={start}
          data-current={i === findIndex || undefined}
          className="rounded-[2px] bg-yellow-300/40 text-transparent data-current:bg-primary/70 dark:bg-yellow-500/30"
        >
          {content.slice(start, end)}
        </mark>,
      );
      last = end;
    }
    if (last < content.length) nodes.push(content.slice(last));
    highlightBody = nodes;
  }

  const sharedTypo = "p-4 font-mono";

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-background", className)}>
      {showHighlight && (
        <div
          ref={highlightRef}
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 select-none overflow-hidden text-transparent",
            sharedTypo,
          )}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight,
            whiteSpace: wordWrap ? "pre-wrap" : "pre",
          }}
        >
          {highlightBody}
          {/* trailing newline so the layer scrolls as tall as the textarea */}
          {"\n"}
        </div>
      )}
      <textarea
        ref={ref}
        value={content}
        onChange={(e) => {
          updateDraft(tabId, e.target.value);
          reportCursor();
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={reportCursor}
        onClick={reportCursor}
        onSelect={reportCursor}
        onScroll={syncScroll}
        spellCheck={false}
        readOnly={readOnly}
        wrap={wordWrap ? "soft" : "off"}
        className={cn(
          "absolute inset-0 h-full w-full resize-none bg-transparent text-foreground outline-none",
          sharedTypo,
        )}
        style={{ fontSize: `${fontSize}px`, lineHeight }}
      />
    </div>
  );
}
