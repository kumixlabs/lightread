import { useMemo } from "react";
import { ChevronRightIcon } from "lucide-react";

import { Button } from "@kumix/ui/ui/button";
import { basename, cn, relativePath } from "@/lib/utils";
import { useStore } from "@/stores/app-store";

export function Breadcrumbs() {
  const rootPath = useStore((s) => s.workspace.rootPath);
  const rootName = useStore((s) => s.workspace.rootName);
  const activeTabId = useStore((s) => s.activeTabId);
  const tabs = useStore((s) => s.tabs);
  const expandedDirs = useStore((s) => s.expandedDirs);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const crumbs = useMemo(() => {
    if (!activeTab) return [];
    const filePath = activeTab.file.path;
    if (rootPath && rootName) {
      const rel = relativePath(filePath, rootPath);
      if (rel !== filePath) {
        const parts = rel.split(/[/\\]/).filter(Boolean);
        return parts.map((part, i) => {
          const fullPath = `${rootPath.replace(/\\/g, "/").replace(/\/$/, "")}/${parts.slice(0, i + 1).join("/")}`;
          return { label: part, path: fullPath, isLast: i === parts.length - 1 };
        });
      }
    }
    return [{ label: basename(filePath), path: filePath, isLast: true }];
  }, [activeTab, rootPath, rootName]);

  const toggleDir = useStore((s) => s.toggleDir);

  const handleCrumbClick = (path: string, isLast: boolean) => {
    if (isLast) return;
    if (!expandedDirs.has(path)) toggleDir(path);
  };

  if (!activeTab) return null;

  return (
    <nav className="flex min-w-0 items-center gap-0.5 overflow-hidden">
      {rootPath && rootName && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 shrink-0 px-1.5 text-muted-foreground text-xs"
            onClick={() => handleCrumbClick(rootPath, false)}
          >
            {rootName}
          </Button>
          {crumbs.length > 0 && (
            <ChevronRightIcon className="size-3 shrink-0 text-muted-foreground" />
          )}
        </>
      )}
      {crumbs.map((crumb) => (
        <div key={crumb.path} className="flex min-w-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 min-w-0 shrink truncate px-1.5 text-xs",
              crumb.isLast ? "cursor-default font-medium text-foreground" : "text-muted-foreground",
            )}
            onClick={() => handleCrumbClick(crumb.path, crumb.isLast)}
            title={crumb.label}
          >
            <span className="truncate">{crumb.label}</span>
          </Button>
          {!crumb.isLast && <ChevronRightIcon className="size-3 shrink-0 text-muted-foreground" />}
        </div>
      ))}
    </nav>
  );
}
