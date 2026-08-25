import { Code2, Eye } from "lucide-react";

import { CodeViewer } from "@/components/viewers/code-viewer";
import { cn } from "@/lib/utils";
import { useStore } from "@/stores/app-store";

interface HtmlViewerProps {
  content: string;
  tabId?: string;
  draft?: string;
  readOnly?: boolean;
  onCursor?: (line: number, col: number) => void;
}

export function HtmlViewer({ content, tabId, draft, readOnly, onCursor }: HtmlViewerProps) {
  const settings = useStore((s) => s.settings);
  // Preview/Source mode persists per tab (survives remounts on tab switch).
  const previewMode = useStore((s) =>
    tabId ? (s.tabs.find((t) => t.id === tabId)?.previewMode ?? true) : true,
  );
  const setPreviewMode = useStore((s) => s.setPreviewMode);
  const mode: "preview" | "source" = previewMode ? "preview" : "source";
  const setMode = (m: "preview" | "source") => {
    if (tabId) setPreviewMode(tabId, m === "preview");
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-1 border-border border-b px-3 py-1.5">
        <button
          onClick={() => setMode("preview")}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-3 font-medium text-xs transition-colors",
            mode === "preview"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <Eye className="size-3.5" />
          Preview
        </button>
        <button
          onClick={() => setMode("source")}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-3 font-medium text-xs transition-colors",
            mode === "source"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <Code2 className="size-3.5" />
          Source
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {mode === "preview" ? (
          <iframe
            srcDoc={draft ?? content}
            sandbox=""
            className="h-full w-full border-0 bg-white"
            title="HTML Preview"
          />
        ) : (
          <CodeViewer
            content={content}
            language="html"
            showLineNumbers={settings.showLineNumbers}
            wordWrap={settings.wordWrap}
            fontSize={settings.fontSize}
            lineHeight={settings.lineHeight}
            codeTheme={settings.codeTheme}
            tabId={tabId}
            draft={draft}
            readOnly={readOnly}
            onCursor={onCursor}
          />
        )}
      </div>
    </div>
  );
}
