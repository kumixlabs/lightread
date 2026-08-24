import { useEffect, useRef, useState } from "react";
import {
  Braces,
  ChevronDown,
  ChevronRight,
  File,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  type LucideIcon,
  Palette,
  Settings,
  Terminal,
} from "lucide-react";

import { readDirectory } from "@/lib/tauri-api";
import { cn, extname } from "@/lib/utils";
import { useStore } from "@/stores/app-store";
import type { FileNode } from "@/types";

const EXT_ICON_MAP: Record<string, LucideIcon> = {
  ".ts": FileCode2,
  ".tsx": FileCode2,
  ".mts": FileCode2,
  ".cts": FileCode2,
  ".js": FileCode2,
  ".jsx": FileCode2,
  ".mjs": FileCode2,
  ".cjs": FileCode2,
  ".json": Braces,
  ".jsonc": Braces,
  ".md": FileText,
  ".mdx": FileText,
  ".markdown": FileText,
  ".html": Globe,
  ".htm": Globe,
  ".xhtml": Globe,
  ".css": Palette,
  ".scss": Palette,
  ".sass": Palette,
  ".less": Palette,
  ".styl": Palette,
  ".py": FileCode2,
  ".pyw": FileCode2,
  ".pyi": FileCode2,
  ".rs": FileCode2,
  ".go": FileCode2,
  ".java": FileCode2,
  ".kt": FileCode2,
  ".rb": FileCode2,
  ".php": FileCode2,
  ".vue": FileCode2,
  ".svelte": FileCode2,
  ".sql": FileCode2,
  ".sh": Terminal,
  ".bash": Terminal,
  ".zsh": Terminal,
  ".ps1": Terminal,
  ".bat": Terminal,
  ".cmd": Terminal,
  ".env": Settings,
  ".ini": Settings,
  ".cfg": Settings,
  ".conf": Settings,
  ".toml": Settings,
  ".yaml": Settings,
  ".yml": Settings,
  ".xml": FileCode2,
};

const IMAGE_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".bmp",
  ".ico",
  ".avif",
]);

export function getFileIcon(name: string): LucideIcon {
  const ext = extname(name);
  if (IMAGE_EXTS.has(ext)) return ImageIcon;
  return EXT_ICON_MAP[ext] ?? File;
}

const EXT_COLOR_MAP: Record<string, string> = {
  ".ts": "text-blue-500",
  ".tsx": "text-blue-500",
  ".js": "text-yellow-500",
  ".jsx": "text-yellow-500",
  ".json": "text-yellow-600",
  ".md": "text-sky-500",
  ".mdx": "text-sky-500",
  ".css": "text-purple-500",
  ".scss": "text-pink-500",
  ".html": "text-orange-500",
  ".py": "text-green-500",
  ".rs": "text-orange-600",
  ".go": "text-cyan-500",
  ".php": "text-indigo-500",
  ".rb": "text-red-500",
  ".vue": "text-green-600",
  ".svelte": "text-orange-600",
};

function getFileColor(name: string): string {
  const ext = extname(name);
  return EXT_COLOR_MAP[ext] ?? "text-muted-foreground";
}

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

export function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const expandedDirs = useStore((s) => s.expandedDirs);
  const toggleDir = useStore((s) => s.toggleDir);
  const openFile = useStore((s) => s.openFile);
  const activeTabId = useStore((s) => s.activeTabId);

  const [lazyChildren, setLazyChildren] = useState<FileNode[] | undefined>(node.children);
  const [loadingChildren, setLoadingChildren] = useState(false);

  const isExpanded = expandedDirs.has(node.path);
  const isActive = activeTabId === node.path;
  const rowRef = useRef<HTMLDivElement>(null);

  // Keep the active file visible when it becomes active (open/switch).
  useEffect(() => {
    if (isActive) rowRef.current?.scrollIntoView({ block: "nearest" });
  }, [isActive]);

  useEffect(() => {
    if (isExpanded && node.isDir && lazyChildren === undefined && !loadingChildren) {
      setLoadingChildren(true);
      readDirectory(node.path, 1)
        .then((children) => setLazyChildren(children))
        .catch(() => {})
        .finally(() => setLoadingChildren(false));
    }
  }, [isExpanded, node.isDir, node.path, lazyChildren, loadingChildren]);

  const handleClick = () => {
    if (node.isDir) {
      toggleDir(node.path);
    } else {
      openFile(node.path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const paddingLeft = depth * 14 + 6;

  if (node.isDir) {
    const FolderIcon = isExpanded ? FolderOpen : Folder;
    return (
      <div>
        <div
          className="group flex cursor-pointer select-none items-center gap-1 py-0.75 pr-2 text-[13px] transition-colors hover:bg-sidebar-accent/50"
          style={{ paddingLeft }}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/70" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/70" />
          )}
          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.name}</span>
        </div>
        {isExpanded && lazyChildren && lazyChildren.length > 0 && (
          <div>
            {lazyChildren.map((child) => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
        {isExpanded && loadingChildren && (
          <div
            className="py-1 text-muted-foreground/60 text-xs"
            style={{ paddingLeft: paddingLeft + 20 }}
          >
            Loading...
          </div>
        )}
        {isExpanded && !loadingChildren && lazyChildren && lazyChildren.length === 0 && (
          <div
            className="py-1 text-muted-foreground/40 text-xs"
            style={{ paddingLeft: paddingLeft + 20 }}
          >
            Empty
          </div>
        )}
      </div>
    );
  }

  const FileIcon = getFileIcon(node.name);
  const fileColor = getFileColor(node.name);

  return (
    <div
      ref={rowRef}
      className={cn(
        "flex cursor-pointer select-none items-center gap-1 py-0.75 pr-2 text-[13px] transition-colors",
        isActive
          ? "bg-primary/12 font-medium text-primary"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
      )}
      style={{ paddingLeft }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="w-3.5 shrink-0" />
      <FileIcon className={cn("size-4 shrink-0", isActive ? "text-primary" : fileColor)} />
      <span className="truncate">{node.name}</span>
    </div>
  );
}
