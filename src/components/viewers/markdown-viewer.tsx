import { createElement, useCallback, useMemo, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Check, Code2, Copy, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { TextEditor } from "@/components/viewers/text-editor";
import { openInDefaultApp, resolveRelativeLink } from "@/lib/tauri-api";
import { cn } from "@/lib/utils";
import { useStore } from "@/stores/app-store";
import type { LoadedFile } from "@/types";

interface MarkdownViewerProps {
  file: LoadedFile;
  tabId: string;
  draft: string | undefined;
  previewMode: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function MarkdownViewer({ file, tabId, draft, previewMode }: MarkdownViewerProps) {
  const setPreviewMode = useStore((s) => s.setPreviewMode);
  const openFile = useStore((s) => s.openFile);
  const setCursor = useStore((s) => s.setCursor);
  const containerRef = useRef<HTMLDivElement>(null);

  const content = draft ?? file.content;

  const toggle = useCallback(
    (preview: boolean) => setPreviewMode(tabId, preview),
    [setPreviewMode, tabId],
  );

  const handleLinkClick = useCallback(
    async (e: React.MouseEvent, href: string) => {
      e.preventDefault();
      if (href.startsWith("#")) {
        const el = containerRef.current?.querySelector(
          `[data-anchor="${CSS.escape(href.slice(1))}"]`,
        );
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const resolved = await resolveRelativeLink(file.path, href);
      if (resolved) {
        await openFile(resolved);
      } else {
        await openInDefaultApp(href);
      }
    },
    [file.path, openFile],
  );

  // Resolve local images relative to the file, via the asset protocol.
  const imgResolver = useCallback(
    (src: string) => {
      if (/^(https?:|data:|blob:)/i.test(src)) return src;
      const p = resolveRelativeLinkSync(file.path, src);
      return p ? convertFileSrc(p) : src;
    },
    [file.path],
  );

  const codeBlockProps = useCodeBlockProps();

  const markdown = useMemo(
    () => (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children }) => (
            <a href={href} onClick={(e) => href && handleLinkClick(e, href)}>
              {children}
            </a>
          ),
          img: ({ src, alt }) =>
            typeof src === "string" ? <img src={imgResolver(src)} alt={alt ?? ""} /> : null,
          h1: heading("h1"),
          h2: heading("h2"),
          h3: heading("h3"),
          h4: heading("h4"),
          h5: heading("h5"),
          h6: heading("h6"),
          pre: codeBlockProps,
        }}
      >
        {content}
      </ReactMarkdown>
    ),
    [content, handleLinkClick, imgResolver, codeBlockProps],
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-1 border-border border-b px-3 py-1.5">
        <ModeButton
          active={previewMode}
          onClick={() => toggle(true)}
          icon={<Eye className="size-3.5" />}
        >
          Preview
        </ModeButton>
        <ModeButton
          active={!previewMode}
          onClick={() => toggle(false)}
          icon={<Code2 className="size-3.5" />}
        >
          Source
        </ModeButton>
        {draft !== undefined && draft !== file.content && (
          <span className="ml-2 text-muted-foreground text-xs">unsaved changes</span>
        )}
      </div>
      <div className="min-h-0 flex-1">
        {previewMode ? (
          <div
            ref={containerRef}
            className="markdown-body mx-auto max-w-3xl px-8 py-8"
            data-viewer-content
          >
            {markdown}
          </div>
        ) : (
          <TextEditor
            tabId={tabId}
            content={content}
            onCursor={setCursor}
            readOnly={file.truncated}
          />
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-3 font-medium text-xs transition-colors",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// Build heading renderers that expose a data-anchor for in-document links.
const TAGS = { h1: "h1", h2: "h2", h3: "h3", h4: "h4", h5: "h5", h6: "h6" } as const;

function heading(tag: keyof typeof TAGS) {
  const Component = ({ children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = extractText(children);
    return createElement(TAGS[tag], { ...rest, "data-anchor": slugify(text) }, children);
  };
  Component.displayName = tag;
  return Component;
}

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in (node as unknown as Record<string, unknown>)) {
    return extractText(
      (node as unknown as { props: { children?: React.ReactNode } }).props.children,
    );
  }
  return "";
}

// Code block with copy button (rendered from `pre` so highlight plugin output is kept).
function useCodeBlockProps() {
  return useCallback((props: React.HTMLAttributes<HTMLPreElement>) => {
    return <CodeBlockPre {...props} />;
  }, []);
}

function CodeBlockPre(props: React.HTMLAttributes<HTMLPreElement>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ref.current) return;
    navigator.clipboard.writeText(ref.current.textContent || "");
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative my-5 overflow-hidden rounded-lg border border-border bg-muted/30">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-md border border-border bg-background/90 px-2 py-1 text-muted-foreground text-xs opacity-0 shadow-sm backdrop-blur transition-all hover:text-foreground group-hover:opacity-100"
      >
        {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre ref={ref} {...props} className="overflow-x-auto p-4 text-[13px] leading-relaxed" />
    </div>
  );
}

// Synchronous subset of resolveRelativeLink for img src resolution.
function resolveRelativeLinkSync(currentFilePath: string, link: string): string | null {
  if (!link || /^(https?:|data:|blob:|#|mailto:|ftp:)/i.test(link) || link.startsWith("/")) {
    return null;
  }
  const dir = currentFilePath.replace(/\\/g, "/").replace(/\/[^/]*$/, "");
  const isUnixAbs = dir.startsWith("/");
  const parts: string[] = dir ? dir.split("/").filter(Boolean) : [];
  const root = parts.length > 0 ? parts[0] : null;
  for (const part of link.replace(/\\/g, "/").split("#")[0].split("/")) {
    if (part === "..") {
      if (parts.length === 0 || (root !== null && parts.length === 1)) return null;
      parts.pop();
    } else if (part !== "." && part !== "") {
      parts.push(part);
    }
  }
  if (parts.length === 0) return null;
  return (isUnixAbs ? "/" : "") + parts.join("/");
}
