import { createHighlighter, type Highlighter } from "shiki";

export const CORE_LANGS = [
  "typescript",
  "javascript",
  "json",
  "json5",
  "jsonl",
  "yaml",
  "toml",
  "xml",
  "html",
  "css",
  "scss",
  "markdown",
  "bash",
  "powershell",
  "sql",
  "dockerfile",
  "makefile",
  "python",
  "go",
  "rust",
  "java",
  "c",
  "cpp",
  "csharp",
];

export const INITIAL_THEMES = ["github-light", "github-dark"] as const;
export const EXTRA_THEMES = [
  "one-dark-pro",
  "dracula",
  "nord",
  "vitesse-dark",
  "vitesse-light",
  "catppuccin-mocha",
  "catppuccin-latte",
  "monokai",
];

const loadedThemes = new Set<string>([...INITIAL_THEMES]);
const loadedLangs = new Set<string>(CORE_LANGS);

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      langs: CORE_LANGS,
      themes: [...INITIAL_THEMES],
    });
  }
  return highlighterPromise;
}

/** Non-core languages are loaded on demand (keeps startup light). */
export async function ensureLang(highlighter: Highlighter, lang: string): Promise<void> {
  if (loadedLangs.has(lang)) return;
  loadedLangs.add(lang); // mark first: a failed load falls back to plaintext
  try {
    await highlighter.loadLanguage(lang as never);
  } catch {
    // unknown language — falls back to plaintext
  }
}

export async function ensureTheme(highlighter: Highlighter, theme: string): Promise<void> {
  if (loadedThemes.has(theme)) return;
  if (!EXTRA_THEMES.includes(theme)) return;
  loadedThemes.add(theme);
  try {
    await highlighter.loadTheme(theme as never);
  } catch {
    loadedThemes.delete(theme);
  }
}

/** Resolve to a loaded shiki theme id for the current light/dark mode. */
export function themeForDark(isDark: boolean): string {
  return isDark ? "github-dark" : "github-light";
}
