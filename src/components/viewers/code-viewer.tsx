import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Highlighter } from "shiki";

import { CORE_LANGS, ensureLang, ensureTheme, getHighlighter } from "@/lib/shiki";
import { cn } from "@/lib/utils";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface CodeViewerProps {
  content: string;
  language: string;
  showLineNumbers: boolean;
  wordWrap: boolean;
  fontSize: number;
  lineHeight: number;
  codeTheme: string;
}

export function CodeViewer({
  content,
  language,
  showLineNumbers,
  wordWrap,
  fontSize,
  lineHeight,
  codeTheme,
}: CodeViewerProps) {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [copied, setCopied] = useState(false);
  const [themeReady, setThemeReady] = useState(true);
  const [langReady, setLangReady] = useState(true);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    getHighlighter().then(setHighlighter);
  }, []);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const activeTheme = codeTheme === "auto" ? (isDark ? "github-dark" : "github-light") : codeTheme;

  useEffect(() => {
    if (!highlighter) return;
    if (activeTheme === "github-dark" || activeTheme === "github-light") return;
    setThemeReady(false);
    ensureTheme(highlighter, activeTheme).then(() => setThemeReady(true));
  }, [highlighter, activeTheme]);

  useEffect(() => {
    if (!highlighter) return;
    if (CORE_LANGS.includes(language)) return;
    setLangReady(false);
    ensureLang(highlighter, language).then(() => setLangReady(true));
  }, [highlighter, language]);

  const { lines } = useMemo(() => {
    if (!highlighter || !themeReady || !langReady)
      return { lines: [] as { num: number; html: string }[] };
    const loaded = highlighter.getLoadedLanguages();
    const lang = loaded.includes(language) ? language : "plaintext";
    try {
      const result = highlighter.codeToTokens(content, {
        lang: lang as never,
        theme: activeTheme as never,
      });
      return {
        lines: result.tokens.map((line, i) => ({
          num: i + 1,
          html:
            line.length === 0
              ? "&#8203;"
              : line
                  .map((token) => {
                    const escaped = escapeHtml(token.content);
                    const style = token.htmlStyle || (token.color ? `color:${token.color}` : "");
                    return style ? `<span style="${style}">${escaped}</span>` : escaped;
                  })
                  .join(""),
        })),
      };
    } catch {
      return {
        lines: content
          .split("\n")
          .map((l, i) => ({ num: i + 1, html: escapeHtml(l) || "&#8203;" })),
      };
    }
  }, [highlighter, content, language, activeTheme, themeReady, langReady]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  if (!highlighter || !themeReady) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground text-sm">
        <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        Loading...
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-background">
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/90 px-2.5 py-1 text-muted-foreground text-xs shadow-sm backdrop-blur transition-all hover:bg-accent hover:text-foreground",
          copied && "text-green-500",
        )}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <div
        className={cn("h-full overflow-auto", wordWrap ? "overflow-x-hidden" : "overflow-x-auto")}
      >
        <pre
          className="min-w-full py-3 font-mono leading-[1.65]"
          style={{ fontSize: `${fontSize}px`, lineHeight }}
        >
          <code className="block">
            {lines.map((line) => (
              <div key={line.num} className="code-line">
                {showLineNumbers && (
                  <span className="code-line-number select-none">{line.num}</span>
                )}
                <span
                  className={cn(
                    "code-line-content flex-1 pr-4",
                    wordWrap ? "wrap-break-word whitespace-pre-wrap" : "whitespace-pre",
                  )}
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML pre-sanitized by syntax highlighter
                  dangerouslySetInnerHTML={{ __html: line.html }}
                />
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
