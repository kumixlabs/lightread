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
import { useStore } from "@/stores/app-store";

export function ViewerRouter() {
  const activeTabId = useStore((s) => s.activeTabId);
  const tabs = useStore((s) => s.tabs);
  const fileLoading = useStore((s) => s.fileLoading);
  const fileError = useStore((s) => s.fileError);
  const changedFiles = useStore((s) => s.changedFiles);
  const settings = useStore((s) => s.settings);
  const reloadFile = useStore((s) => s.reloadFile);
  const clearFileChanged = useStore((s) => s.clearFileChanged);
  const setCursor = useStore((s) => s.setCursor);

  const activeTab = tabs.find((t) => t.id === activeTabId);

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
        <CircleAlert className="size-8 text-destructive" />
        <p className="font-medium text-sm">{fileError}</p>
        <p className="text-muted-foreground text-xs">Try opening the file again.</p>
      </div>
    );
  }

  if (!activeTab) return null;

  const { file } = activeTab;
  const isChanged = changedFiles.has(file.path);
  const saveError = activeTab.draft !== undefined && fileError ? fileError : null;

  const renderViewer = () => {
    switch (file.viewerType) {
      case "markdown":
        return (
          <MarkdownViewer
            file={file}
            tabId={activeTab.id}
            draft={activeTab.draft}
            previewMode={!!activeTab.previewMode}
          />
        );
      case "text":
        return (
          <TextEditor
            tabId={activeTab.id}
            content={activeTab.draft ?? file.content}
            onCursor={setCursor}
            readOnly={!!file.truncated}
          />
        );
      case "code": {
        // ponytail: pretty-print minified JSON (<2MB) for display; streaming formatter if huge files ever matter
        let codeContent = file.content;
        if (
          file.language === "json" &&
          !file.content.includes("\n") &&
          file.content.length < 2_000_000
        ) {
          try {
            codeContent = JSON.stringify(JSON.parse(file.content), null, 2);
          } catch {
            /* invalid json — show raw */
          }
        }
        return (
          <CodeViewer
            content={codeContent}
            language={file.language || "plaintext"}
            showLineNumbers={settings.showLineNumbers}
            wordWrap={settings.wordWrap}
            fontSize={settings.fontSize}
            lineHeight={settings.lineHeight}
            codeTheme={settings.codeTheme}
            tabId={activeTab.id}
            draft={activeTab.draft}
            readOnly={!!file.truncated}
            onCursor={setCursor}
          />
        );
      }
      case "csv":
        return (
          <CsvViewer
            content={file.content}
            draft={activeTab.draft}
            tabId={activeTab.id}
            fontSize={settings.fontSize}
            onCursor={setCursor}
            readOnly={!!file.truncated}
          />
        );
      case "image":
        return <ImageViewer file={file} />;
      case "media":
        return <MediaViewer file={file} />;
      case "svg":
        return (
          <SvgViewer
            content={file.content}
            tabId={activeTab.id}
            draft={activeTab.draft}
            readOnly={!!file.truncated}
            onCursor={setCursor}
          />
        );
      case "html":
        return (
          <HtmlViewer
            content={file.content}
            tabId={activeTab.id}
            draft={activeTab.draft}
            readOnly={!!file.truncated}
            onCursor={setCursor}
          />
        );
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
      {isChanged && (
        <div className="flex items-center justify-between gap-2 border-yellow-500/30 border-b bg-yellow-500/10 px-4 py-2 text-[13px] text-yellow-700 dark:text-yellow-400">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-3.5" />
            {activeTab.draft !== undefined && activeTab.draft !== file.content
              ? "This file has changed on disk. Your unsaved edits are kept."
              : "This file has changed on disk."}
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
      <div key={activeTab.id} className="h-full">
        {renderViewer()}
      </div>
    </div>
  );
}
