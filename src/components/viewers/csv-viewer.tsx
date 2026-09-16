import { useMemo, useState } from "react";
import { ChevronDown, Code2, Table } from "lucide-react";

import { TextEditor } from "@/components/viewers/text-editor";
import { parseCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

interface CsvViewerProps {
  content: string;
  tabId?: string;
  draft?: string;
  fontSize: number;
  readOnly?: boolean;
  onCursor?: (line: number, col: number) => void;
}

export function CsvViewer({ content, tabId, draft, fontSize, readOnly, onCursor }: CsvViewerProps) {
  const [mode, setMode] = useState<"table" | "source">("table");
  const effective = draft ?? content;

  const delimiter = useMemo(() => {
    const firstLine = effective.split("\n")[0] ?? "";
    return (firstLine.match(/\t/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0)
      ? "\t"
      : ",";
  }, [effective]);

  const rows = useMemo(() => parseCsv(effective, delimiter), [effective, delimiter]);
  const [header, ...body] = rows;
  // Render cap: 100k-row CSVs must not freeze the DOM (Load more grows it).
  const [rowLimit, setRowLimit] = useState(1000);
  const visibleBody = body.slice(0, rowLimit);

  return (
    <div className="flex h-full flex-col bg-background">
      {tabId && !readOnly && (
        <div className="flex items-center gap-1 border-border border-b px-3 py-1.5">
          <button
            onClick={() => setMode("table")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-xs transition-colors",
              mode === "table"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Table className="size-3.5" />
            Table
          </button>
          <button
            onClick={() => setMode("source")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-xs transition-colors",
              mode === "source"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Code2 className="size-3.5" />
            Source
          </button>
        </div>
      )}
      {mode === "source" && tabId ? (
        <TextEditor tabId={tabId} content={effective} onCursor={onCursor} readOnly={readOnly} />
      ) : (
        <div className="h-full overflow-auto p-4" data-viewer-content>
          <table className="w-max border-collapse text-left" style={{ fontSize }}>
            {header && (
              <thead className="sticky top-0 bg-background shadow-[0_1px_0_0_var(--border)]">
                <tr>
                  {header.map((cell, i) => (
                    <th
                      key={i}
                      className="whitespace-nowrap border-border border-b px-3 py-1.5 font-semibold"
                    >
                      {cell || "\u00A0"}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {visibleBody.map((r, ri) => (
                <tr key={ri} className={cn(ri % 2 === 1 && "bg-muted/40")}>
                  {r.map((cell, ci) => (
                    <td key={ci} className="whitespace-nowrap border-border px-3 py-1.5">
                      {cell || "\u00A0"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {body.length > rowLimit && (
            <button
              onClick={() => setRowLimit((l) => l + 5000)}
              className="mx-auto mt-4 flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronDown className="size-3.5" />
              Show more rows ({(body.length - rowLimit).toLocaleString()} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
