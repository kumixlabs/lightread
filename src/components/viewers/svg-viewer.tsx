import { useState } from "react";
import { Code2, Eye } from "lucide-react";

import { CodeViewer } from "@/components/viewers/code-viewer";
import { cn } from "@/lib/utils";
import { useStore } from "@/stores/app-store";

interface SvgViewerProps {
  content: string;
  tabId?: string;
  draft?: string;
  readOnly?: boolean;
  onCursor?: (line: number, col: number) => void;
}

export function SvgViewer({ content, tabId, draft, readOnly, onCursor }: SvgViewerProps) {
  const settings = useStore((s) => s.settings);
  const [mode, setMode] = useState<"source" | "preview">("preview");

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
          <div className="flex h-full items-center justify-center overflow-auto p-8">
            {/* ponytail: srcDoc iframe defaults 300×150; svg fills via viewBox or
                stretches. Full-size iframe keeps it sandboxed while using the
                whole viewport. Upgrade path: zoom controls if ever needed. */}
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><style>html,body{margin:0;height:100%;background:transparent;display:flex;align-items:center;justify-content:center}svg{max-width:100%;max-height:100%;width:auto;height:auto}</style></head><body>${draft ?? content}</body></html>`}
              sandbox=""
              className="h-full w-full border-0 bg-transparent"
              title="SVG Preview"
            />
          </div>
        ) : (
          <CodeViewer
            content={content}
            language="xml"
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
