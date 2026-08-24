import { useEffect, useRef, useState } from "react";
import { Check, Copy, Hash, WrapText } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";
import { useStore } from "@/stores/app-store";

interface TextViewerProps {
  content: string;
}

export function TextViewer({ content }: TextViewerProps) {
  const settings = useStore((s) => s.settings);
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(settings.showLineNumbers);
  const [wordWrap, setWordWrap] = useState(settings.wordWrap);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const lines = content.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  return (
    <div className="relative flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-border border-b px-3 py-1.5">
        <span className="text-muted-foreground text-xs">{formatNumber(lines.length)} lines</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLineNumbers((v) => !v)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              showLineNumbers && "bg-accent text-foreground",
            )}
            title="Toggle line numbers"
          >
            <Hash className="size-4" />
          </button>
          <button
            onClick={() => setWordWrap((v) => !v)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              wordWrap && "bg-accent text-foreground",
            )}
            title="Toggle word wrap"
          >
            <WrapText className="size-4" />
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <div
        className={cn("flex-1 overflow-auto", wordWrap ? "overflow-x-hidden" : "overflow-x-auto")}
      >
        <pre
          className="min-w-full py-3 font-mono leading-[1.6]"
          style={{ fontSize: `${settings.fontSize}px` }}
        >
          <code className="block">
            {lines.map((line, i) => (
              <div key={i} className="code-line hover:bg-foreground/[0.03]">
                {showLineNumbers && <span className="code-line-number select-none">{i + 1}</span>}
                <span
                  className={cn(
                    "code-line-content flex-1 pr-4",
                    wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
                  )}
                >
                  {line || "\u200B"}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
