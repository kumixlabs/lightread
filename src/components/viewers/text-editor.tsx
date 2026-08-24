import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { useStore } from "@/stores/app-store";

interface TextEditorProps {
  tabId: string;
  content: string;
  onCursor?: (line: number, col: number) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * Plain notepad-style editing surface. No highlighting, no fancy features —
 * that is the point.
 */
export function TextEditor({ tabId, content, onCursor, readOnly, className }: TextEditorProps) {
  const updateDraft = useStore((s) => s.updateDraft);
  const fontSize = useStore((s) => s.settings.fontSize);
  const wordWrap = useStore((s) => s.settings.wordWrap);
  const ref = useRef<HTMLTextAreaElement>(null);

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

  return (
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
      spellCheck={false}
      readOnly={readOnly}
      wrap={wordWrap ? "soft" : "off"}
      className={cn(
        "h-full w-full resize-none bg-background p-4 font-mono text-foreground leading-relaxed outline-none",
        className,
      )}
      style={{ fontSize: `${fontSize}px` }}
    />
  );
}
