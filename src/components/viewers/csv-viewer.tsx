import { useMemo } from "react";

import { cn } from "@/lib/utils";

/** RFC 4180-lite parser: quotes, escaped quotes, commas and newlines inside quotes. */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

interface CsvViewerProps {
  content: string;
  fontSize: number;
}

export function CsvViewer({ content, fontSize }: CsvViewerProps) {
  const delimiter = useMemo(() => {
    const firstLine = content.split("\n")[0] ?? "";
    return (firstLine.match(/\t/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0)
      ? "\t"
      : ",";
  }, [content]);

  const rows = useMemo(() => parseCsv(content, delimiter), [content, delimiter]);
  const [header, ...body] = rows;

  return (
    <div className="h-full overflow-auto bg-background p-4" data-viewer-content>
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
          {body.map((r, ri) => (
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
    </div>
  );
}
