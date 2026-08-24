import { useMemo } from "react";
import { AlertCircle, Monitor, Moon, Sun } from "lucide-react";

import { formatBytes, relativePath } from "@/lib/utils";
import { useStore } from "@/stores/app-store";
import type { Theme } from "@/types";

const THEME_CYCLE: Theme[] = ["light", "dark", "system"];
const THEME_ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function StatusBar() {
  const tabs = useStore((s) => s.tabs);
  const activeTabId = useStore((s) => s.activeTabId);
  const rootPath = useStore((s) => s.workspace.rootPath);
  const changedFiles = useStore((s) => s.changedFiles);
  const cursor = useStore((s) => s.cursor);
  const theme = useStore((s) => s.settings.theme);
  const updateSettings = useStore((s) => s.updateSettings);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const file = activeTab?.file;
  const content = activeTab ? (activeTab.draft ?? activeTab.file.content) : "";

  const lineCount = useMemo(() => (content ? content.split("\n").length : 0), [content]);
  const wordCount = useMemo(() => (content ? (content.match(/\S+/g) ?? []).length : 0), [content]);

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
    updateSettings({ theme: next });
  };

  const ThemeIcon = THEME_ICON[theme];

  const ThemeBtn = (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-accent"
      title={`Theme: ${theme}`}
    >
      <ThemeIcon className="size-3.5" />
      <span className="capitalize">{theme}</span>
    </button>
  );

  if (!activeTab) {
    return (
      <div className="flex h-7 items-center justify-end border-border border-t bg-muted/30 px-3 text-[11px] text-muted-foreground">
        {ThemeBtn}
      </div>
    );
  }

  if (!file) return null;

  const filePath = rootPath ? relativePath(file.path, rootPath) : file.name;
  const isChanged = changedFiles.has(file.path);

  return (
    <div className="flex h-7 items-center gap-3 overflow-hidden border-border border-t bg-muted/30 px-3 text-[11px] text-muted-foreground">
      {isChanged && (
        <span className="flex shrink-0 items-center gap-1 rounded bg-yellow-500/15 px-1.5 py-0.5 text-yellow-600 dark:text-yellow-500">
          <AlertCircle className="size-3" />
          Changed
        </span>
      )}
      <span className="truncate">{filePath}</span>
      <div className="flex-1" />
      {file.language && (
        <span className="shrink-0 font-medium text-foreground/70">{file.language}</span>
      )}
      {lineCount > 0 && (
        <span className="shrink-0 tabular-nums">{lineCount.toLocaleString()} lines</span>
      )}
      {(file.viewerType === "text" || file.viewerType === "markdown") && (
        <>
          <span className="shrink-0 tabular-nums">
            {wordCount.toLocaleString()} words, {content.length.toLocaleString()} chars
          </span>
          <span className="shrink-0 tabular-nums">
            Ln {cursor.line}, Col {cursor.col}
          </span>
          <span className="shrink-0 tabular-nums">{file.lossy ? "UTF-8 (lossy)" : "UTF-8"}</span>
        </>
      )}
      <span className="shrink-0 tabular-nums">{formatBytes(file.size)}</span>
      <div className="h-3 w-px bg-border" />
      {ThemeBtn}
    </div>
  );
}
