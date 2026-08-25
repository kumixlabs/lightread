import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Check, Code2, Copy, Eye, ListTree } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { TextEditor } from "@/components/viewers/text-editor";
import { ensureLang, getHighlighter, themeForDark } from "@/lib/shiki";
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

interface TocEntry {
  level: number;
  text: string;
  id: string;
}

interface FrontmatterData {
  raw: string;
  pairs: [string, string][];
}

/** Split leading `---` YAML frontmatter off the markdown body. */
function splitFrontmatter(md: string): { frontmatter: FrontmatterData | null; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
  if (!m) return { frontmatter: null, body: md };
  const pairs: [string, string][] = [];
  for (const line of m[1].split("\n")) {
    const kv = /^([\w$.-]+):\s*(.*)$/.exec(line.trim());
    if (kv) pairs.push([kv[1], kv[2].replace(/^["']|["']$/g, "")]);
  }
  return { frontmatter: { raw: m[1], pairs }, body: md.slice(m[0].length) };
}

/** Extract h2-h3 (skipping fenced code blocks) for the outline. */
function extractToc(md: string): TocEntry[] {
  const out: TocEntry[] = [];
  let inCode = false;
  for (const line of md.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inCode = !inCode;
    if (inCode) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) {
      const text = m[2].replace(/[*_`~]/g, "").trim();
      out.push({ level: m[1].length, text, id: slugify(text) });
    }
  }
  return out;
}

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export function MarkdownViewer({ file, tabId, draft, previewMode }: MarkdownViewerProps) {
  const setPreviewMode = useStore((s) => s.setPreviewMode);
  const openFile = useStore((s) => s.openFile);
  const setCursor = useStore((s) => s.setCursor);
  const fontSize = useStore((s) => s.settings.fontSize);
  const lineHeight = useStore((s) => s.settings.lineHeight);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showToc, setShowToc] = useState(true);
  const [activeId, setActiveId] = useState("");

  const content = draft ?? file.content;

  // Split YAML frontmatter (--- ... ---) off the body before rendering.
  const { frontmatter, body } = useMemo(() => splitFrontmatter(content), [content]);

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
      const resolved = await resolveRelativeLink(file.path, href.split("#")[0]);
      if (resolved) openFile(resolved);
      else await openInDefaultApp(href);
    },
    [file.path, openFile],
  );

  const toc = useMemo(() => extractToc(body), [body]);

  const scrollToAnchor = useCallback((id: string) => {
    const el = containerRef.current?.querySelector(`[data-anchor="${CSS.escape(id)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id); // optimistic: spy confirms once scroll settles
  }, []);

  // Scroll-spy: last heading scrolled past = active TOC entry.
  useEffect(() => {
    const container = containerRef.current;
    if (!previewMode || !container) return;
    const update = () => {
      const headings = [...container.querySelectorAll("[data-anchor]")] as HTMLElement[];
      // At/near bottom (short last section can never reach the line): last heading wins.
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
        setActiveId(headings[headings.length - 1]?.dataset.anchor ?? "");
        return;
      }
      let current = "";
      for (const h of headings) {
        const top = h.getBoundingClientRect().top - container.getBoundingClientRect().top;
        if (top <= 120) current = h.dataset.anchor ?? "";
        else break;
      }
      setActiveId(current);
    };
    update();
    container.addEventListener("scroll", update, { passive: true });
    return () => container.removeEventListener("scroll", update);
  }, [previewMode]);

  const components = useMemo(
    () => ({
      a: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} onClick={(e) => href && handleLinkClick(e, href)} {...rest}>
          {children}
        </a>
      ),
      img: ({ src, alt, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => {
        let url = src;
        if (typeof src === "string" && !/^(https?|data|asset):/i.test(src)) {
          // Resolve ./ ../ against the markdown file's directory (client-side;
          // upgrade path: shared Rust resolver if Windows edge cases appear).
          const parts = file.path.replace(/\\/g, "/").split("/");
          parts.pop();
          for (const p of src.replace(/\\/g, "/").split("/")) {
            if (!p || p === ".") continue;
            if (p === "..") {
              // Guard: never pop past the drive root / first segment.
              if (parts.length > 1) parts.pop();
            } else parts.push(p);
          }
          url = convertFileSrc(parts.join("/"));
        }
        return <img src={url} alt={alt} loading="lazy" {...rest} />;
      },
      // Shiki-highlighted code blocks (fallback: plain pre until ready).
      pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => (
        <ShikiBlock>{children}</ShikiBlock>
      ),
      h1: heading("h1"),
      h2: heading("h2"),
      h3: heading("h3"),
      h4: heading("h4"),
      h5: heading("h5"),
      h6: heading("h6"),
    }),
    [handleLinkClick, file.path.replace],
  );

  const markdown = useMemo(
    () => (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as never}>
        {body}
      </ReactMarkdown>
    ),
    [components, body],
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-10 shrink-0 items-center gap-1 border-border border-b px-3">
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
        {previewMode && toc.length >= 3 && (
          <>
            <span className="flex-1" />
            <ModeButton
              active={showToc}
              onClick={() => setShowToc((v) => !v)}
              icon={<ListTree className="size-3.5" />}
            >
              Outline
            </ModeButton>
          </>
        )}
      </div>
      <div className="flex min-h-0 flex-1">
        <div
          ref={containerRef}
          className="markdown-body prose dark:prose-invert min-h-0 max-w-none flex-1 overflow-y-auto"
          data-viewer-content
        >
          {previewMode ? (
            <div
              className="mx-auto max-w-3xl px-8 py-8"
              style={{ fontSize: `${fontSize}px`, lineHeight }}
            >
              {frontmatter && <Frontmatter data={frontmatter} />}
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
        {previewMode && showToc && toc.length >= 3 && (
          <nav className="hidden w-56 shrink-0 overflow-y-auto border-border border-l px-4 py-6 text-sm lg:block">
            <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              On this page
            </p>
            <ul className="space-y-1">
              {toc.map((h) => (
                <li key={`${h.id}-${h.level}`}>
                  <button
                    onClick={() => scrollToAnchor(h.id)}
                    className={cn(
                      "block w-full truncate text-left text-muted-foreground transition-colors hover:text-foreground",
                      h.level === 2 && "font-medium",
                      h.level === 3 && "pl-3 text-[13px]",
                      h.id === activeId && "text-primary",
                    )}
                    title={h.text}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
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

// Build heading renderers that expose data-anchor + hover anchor link (GitHub-style).
function heading(tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  const Component = ({ children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = extractText(children);
    const id = slugify(text);
    const [copied, setCopied] = useState(false);
    return createElement(
      tag,
      { ...rest, "data-anchor": id, className: "group relative inline-block w-full" },
      children,
      createElement(
        "button",
        {
          onClick: () => {
            navigator.clipboard.writeText(`#${id}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          },
          className:
            "absolute -left-5 top-1/2 -translate-y-1/2 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:!text-foreground",
          title: `Copy anchor: #${id}`,
          "aria-label": `Copy anchor link to section ${text}`,
        },
        copied ? "✓" : "#",
      ),
    );
  };
  Component.displayName = tag;
  return Component;
}

/** Collapsed-by-default YAML frontmatter panel. */
function Frontmatter({ data }: { data: FrontmatterData }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-muted-foreground text-xs transition-colors hover:text-foreground"
      >
        {open ? "▾" : "▸"} Frontmatter · {data.pairs.length} field
        {data.pairs.length !== 1 ? "s" : ""}
      </button>
      {open && (
        <dl className="mt-2 grid gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/30 p-3 text-xs sm:grid-cols-[minmax(0,10rem)_1fr]">
          {data.pairs.map(([k, v]) => (
            <div key={k} className="col-span-full grid grid-cols-[minmax(0,10rem)_1fr] gap-x-4">
              <dt className="font-medium font-mono text-muted-foreground">{k}</dt>
              <dd className="wrap-break-word font-mono">{v || "\u2014"}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in (node as object)) {
    const props = (node as { props?: { children?: React.ReactNode } }).props;
    return extractText(props?.children);
  }
  return "";
}

/** A fenced code block: shiki HTML once loaded, plain pre before that. */
function ShikiBlock({ children }: { children?: React.ReactNode }) {
  const isDark = useIsDark();
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { code, lang } = useMemo(() => extractCode(children), [children]);

  useEffect(() => {
    let alive = true;
    setHtml(null);
    (async () => {
      const hl = await getHighlighter();
      await ensureLang(hl, lang);
      if (!alive) return;
      const loaded = hl.getLoadedLanguages();
      const resolved = loaded.includes(lang) ? lang : "plaintext";
      setHtml(hl.codeToHtml(code, { lang: resolved, theme: themeForDark(isDark) }));
    })();
    return () => {
      alive = false;
    };
  }, [code, lang, isDark]);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="group relative my-5">
      {lang !== "text" && (
        <span className="absolute -top-2 left-3 z-10 rounded bg-muted px-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wide">
          {lang}
        </span>
      )}
      {html ? (
        <div
          className="overflow-hidden rounded-lg [&>pre]:my-0!"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML generated by shiki syntax highlighter
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto rounded-lg bg-muted/40 p-4 text-[13px] leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
      <button
        onClick={copy}
        className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md bg-background/80 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground group-hover:opacity-100"
        title="Copy code"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

/** Pull raw text + language out of react-markdown's code element. */
function extractCode(children: React.ReactNode): { code: string; lang: string } {
  const child = Array.isArray(children) ? children[0] : children;
  let lang = "text";
  if (child && typeof child === "object" && "props" in (child as object)) {
    const props = (child as { props?: { className?: string; children?: React.ReactNode } }).props;
    const m = props?.className ? /language-([\w-]+)/.exec(props.className) : null;
    if (m) lang = m[1].toLowerCase();
    return { code: extractText(props?.children), lang };
  }
  return { code: extractText(children), lang };
}
