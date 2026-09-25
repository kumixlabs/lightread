import { Component, type ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CircleAlert, RefreshCw } from "lucide-react";

import { Button } from "@kumix/ui/ui/button";
import { Skeleton } from "@kumix/ui/ui/skeleton";
import { CodeViewer } from "@/components/viewers/code-viewer";
import { CsvViewer } from "@/components/viewers/csv-viewer";
import { HtmlViewer } from "@/components/viewers/html-viewer";
import { ImageViewer } from "@/components/viewers/image-viewer";
import { MarkdownViewer } from "@/components/viewers/markdown-viewer";
import { MediaViewer } from "@/components/viewers/media-viewer";
import { SvgViewer } from "@/components/viewers/svg-viewer";
import { TextEditor } from "@/components/viewers/text-editor";
import { UnsupportedViewer } from "@/components/viewers/unsupported-viewer";
import { toPosix, useStore } from "@/stores/app-store";
import type { Tab } from "@/types";

/** A render crash in one viewer must not white-screen the whole app. */
class ViewerErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
          <CircleAlert className="size-8 text-destructive" />
          <p className="font-medium text-sm">This file failed to render</p>
          <p className="max-w-md text-muted-foreground text-xs">{String(this.state.error)}</p>
          <Button size="sm" variant="outline" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ViewerRouter() {
  const activeTabId = useStore((s) => s.activeTabId);
  const tabs = useStore((s) => s.tabs);
  const fileLoading = useStore((s) => s.fileLoading);
  const fileError = useStore((s) => s.fileError);
  const changedFiles = useStore((s) => s.changedFiles);
  const missingFiles = useStore((s) => s.missingFiles);
  const settings = useStore((s) => s.settings);
  const reloadFile = useStore((s) => s.reloadFile);
  const clearFileChanged = useStore((s) => s.clearFileChanged);
  const closeTab = useStore((s) => s.closeTab);
  const clearMissing = useStore((s) => s.clearMissing);
  const setCursor = useStore((s) => s.setCursor);
  const findOpen = useStore((s) => s.findOpen);
  const pendingReveal = useStore((s) => s.pendingReveal);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Keep-alive: mount a tab's viewer on first activation, keep it mounted
  // (hidden) afterwards so scroll / zoom / mode survive tab switches.
  // Prune closed tabs so the set doesn't grow unbounded.
  const [mounted, setMounted] = useState<Set<string>>(() => new Set());
  const tabIds = useMemo(() => new Set(tabs.map((t) => t.id)), [tabs]);
  useEffect(() => {
    if (!activeTabId) return;
    setMounted((m) => {
      // Add active tab + prune ids no longer in open tabs.
      const next = new Set<string>();
      for (const id of m) if (tabIds.has(id)) next.add(id);
      next.add(activeTabId);
      return next.size === m.size && m.has(activeTabId) ? m : next;
    });
  }, [activeTabId, tabIds]);

  // Switching to a kept-alive tab: pause hidden media and refocus the editing
  // surface (mirrors the old remount-focus behavior; find bar keeps its focus).
  useEffect(() => {
    if (!activeTabId) return;
    const id = activeTabId;
    const raf = requestAnimationFrame(() => {
      document.querySelectorAll("[data-tab]").forEach((wrapper) => {
        if (wrapper.getAttribute("data-tab") === id) return;
        wrapper.querySelectorAll("video, audio").forEach((m) => {
          const media = m as HTMLMediaElement;
          if (!media.paused) media.pause();
        });
      });
      if (findOpen) return;
      const wrap = document.querySelector(`[data-tab="${CSS.escape(id)}"]`);
      wrap?.querySelector("textarea")?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTabId, findOpen]);

  // Project-search jump: scroll the active viewer to a line.
  useEffect(() => {
    if (!pendingReveal || !activeTabId) return;
    if (toPosix(pendingReveal.path) !== toPosix(activeTabId)) return;
    useStore.setState({ pendingReveal: null });
    const { line } = pendingReveal;
    const id = activeTabId;
    requestAnimationFrame(() => {
      const wrap = document.querySelector(`[data-tab="${CSS.escape(id)}"]`);
      if (!wrap) return;
      const ta = wrap.querySelector("textarea");
      if (ta) {
        const lh = Number.parseFloat(getComputedStyle(ta).lineHeight) || 20;
        ta.scrollTop = Math.max(0, (line - 1) * lh + 16 - ta.clientHeight / 3);
        return;
      }
      wrap.querySelectorAll<HTMLElement>(".code-line")[line - 1]?.scrollIntoView({
        block: "center",
      });
    });
  }, [pendingReveal, activeTabId]);

  if (fileLoading) {
    return (
      <div className="flex h-full flex-col gap-3 bg-background p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (fileError && !activeTab) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="font-medium text-sm">Could not open file</p>
        <p className="max-w-md text-muted-foreground text-xs">{fileError}</p>
      </div>
    );
  }

  if (!activeTab) return null;

  const { file } = activeTab;
  const isChanged = changedFiles.has(file.path);
  const isMissing = missingFiles.has(file.path);
  const saveError =
    activeTab.draft !== undefined && activeTab.draft !== file.content ? fileError : null;

  const renderViewer = (tab: Tab) => {
    const { file } = tab;
    switch (file.viewerType) {
      case "markdown":
        return (
          <MarkdownViewer
            file={file}
            tabId={tab.id}
            draft={tab.draft}
            previewMode={!!tab.previewMode}
          />
        );
      case "text":
        return (
          <TextEditor
            tabId={tab.id}
            content={tab.draft ?? file.content}
            readOnly={!!file.truncated || !!file.lossy}
            onCursor={tab.id === activeTabId ? setCursor : undefined}
          />
        );
      case "code":
        return (
          <CodeViewer
            content={file.content}
            language={file.language ?? "plaintext"}
            showLineNumbers={settings.showLineNumbers}
            wordWrap={settings.wordWrap}
            fontSize={settings.fontSize}
            lineHeight={settings.lineHeight}
            codeTheme={settings.codeTheme}
            tabId={tab.id}
            draft={tab.draft}
            readOnly={!!file.truncated || !!file.lossy}
            onCursor={tab.id === activeTabId ? setCursor : undefined}
          />
        );
      case "html":
        return (
          <HtmlViewer
            content={file.content}
            tabId={tab.id}
            draft={tab.draft}
            readOnly={!!file.truncated}
            onCursor={tab.id === activeTabId ? setCursor : undefined}
          />
        );
      case "svg":
        return (
          <SvgViewer
            content={file.content}
            tabId={tab.id}
            draft={tab.draft}
            readOnly={!!file.truncated}
            onCursor={tab.id === activeTabId ? setCursor : undefined}
          />
        );
      case "csv":
        return (
          <CsvViewer
            content={file.content}
            tabId={tab.id}
            draft={tab.draft}
            fontSize={settings.fontSize}
            readOnly={!!file.truncated}
            onCursor={tab.id === activeTabId ? setCursor : undefined}
          />
        );
      case "image":
        return <ImageViewer file={file} />;
      case "media":
        return <MediaViewer file={file} />;
      default:
        return <UnsupportedViewer file={file} />;
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {saveError && (
        <div className="flex items-center gap-2 border-red-500/30 border-b bg-red-500/10 px-4 py-2 text-[13px] text-red-700 dark:text-red-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="truncate">{saveError}</span>
        </div>
      )}
      {isMissing && (
        <div className="flex items-center justify-between gap-2 border-red-500/30 border-b bg-red-500/10 px-4 py-2 text-[13px] text-red-700 dark:text-red-400">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-3.5" />
            This file was deleted or moved on disk.
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => closeTab(activeTab.id)}
            >
              Close tab
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs opacity-60"
              onClick={() => clearMissing(file.path)}
            >
              Keep
            </Button>
          </div>
        </div>
      )}
      {isChanged && (
        <div className="flex items-center justify-between gap-2 border-yellow-500/30 border-b bg-yellow-500/10 px-4 py-2 text-[13px] text-yellow-700 dark:text-yellow-400">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-3.5" />
            {activeTab.draft !== undefined && activeTab.draft !== file.content
              ? "This file changed on disk. Your unsaved edits are kept."
              : "This file changed on disk."}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1.5 px-2 text-xs"
              onClick={() => reloadFile(activeTab.id)}
            >
              <RefreshCw className="size-3" />
              Reload from disk
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs opacity-60"
              onClick={() => clearFileChanged(file.path)}
            >
              Keep mine
            </Button>
          </div>
        </div>
      )}
      {file.truncated && (
        <div className="flex items-center gap-2 border-blue-500/30 border-b bg-blue-500/10 px-4 py-2 text-[13px] text-blue-700 dark:text-blue-400">
          <AlertTriangle className="size-3.5" />
          Large file — showing first 10 MB only. Read-only.
        </div>
      )}
      <div className="min-h-0 flex-1">
        {tabs
          .filter((t) => mounted.has(t.id))
          .map((tab) => (
            <div
              key={tab.id}
              data-tab={tab.id}
              className={tab.id === activeTabId ? "h-full" : "hidden"}
            >
              <ViewerErrorBoundary>{renderViewer(tab)}</ViewerErrorBoundary>
            </div>
          ))}
      </div>
    </div>
  );
}
