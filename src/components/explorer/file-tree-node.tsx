import { useEffect, useRef, useState } from "react";
import {
  Braces,
  ChevronRight,
  File,
  FileCode2,
  FilePlus2,
  FileText,
  FileVideo,
  FileVolume2,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe,
  Image as ImageIcon,
  type LucideIcon,
  Palette,
  Pencil,
  Settings,
  Table2,
  Terminal,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { EASE_OUT, SPRING_SWAP } from "@kumix/ui/lib/ease";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@kumix/ui/motion/context-menu";
import { readDirectory } from "@/lib/tauri-api";
import { cn, extname } from "@/lib/utils";
import { markTreeRead, useStore } from "@/stores/app-store";
import type { FileNode } from "@/types";

/** Inline name input for create/rename in the tree (VS Code style). */
export function NameInput({
  depth,
  initial = "",
  placeholder,
  onCommit,
  onCancel,
}: {
  depth: number;
  initial?: string;
  placeholder?: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const finish = (commit: boolean) => {
    if (done.current) return;
    done.current = true;
    if (commit && value.trim()) onCommit(value);
    else onCancel();
  };

  return (
    <div className="flex items-center gap-1 py-0.5 pr-2" style={{ paddingLeft: depth * 14 + 26 }}>
      <input
        ref={ref}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            finish(true);
          } else if (e.key === "Escape") {
            e.preventDefault();
            finish(false);
          }
        }}
        onBlur={() => finish(true)}
        className="h-6 w-full rounded-sm border border-ring bg-background px-1 text-[13px] outline-none"
      />
    </div>
  );
}

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
  ".csv": Table2,
  ".tsv": Table2,
  ".mp3": FileVolume2,
  ".wav": FileVolume2,
  ".flac": FileVolume2,
  ".ogg": FileVolume2,
  ".m4a": FileVolume2,
  ".aac": FileVolume2,
  ".opus": FileVolume2,
  ".wma": FileVolume2,
  ".aiff": FileVolume2,
  ".mid": FileVolume2,
  ".midi": FileVolume2,
  ".mp4": FileVideo,
  ".webm": FileVideo,
  ".mkv": FileVideo,
  ".mov": FileVideo,
  ".avi": FileVideo,
  ".wmv": FileVideo,
  ".flv": FileVideo,
  ".m4v": FileVideo,
  ".mpg": FileVideo,
  ".mpeg": FileVideo,
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
  ".csv": "text-emerald-600",
  ".mp3": "text-fuchsia-500",
  ".wav": "text-fuchsia-500",
  ".flac": "text-fuchsia-500",
  ".m4a": "text-fuchsia-500",
  ".ogg": "text-fuchsia-500",
  ".mp4": "text-rose-500",
  ".webm": "text-rose-500",
  ".mkv": "text-rose-500",
  ".mov": "text-rose-500",
  ".avi": "text-rose-500",
};

function getFileColor(name: string): string {
  const ext = extname(name);
  return EXT_COLOR_MAP[ext] ?? "text-muted-foreground";
}

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

// Branch-guide draw timing, matching @kumix/ui motion/file-tree.
const BRANCH_DRAW = { duration: 0.3, ease: EASE_OUT } as const;

export function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const reduce = useReducedMotion() ?? false;
  // Row: quick fade only (no slide/stagger). Expand/collapse smoothness comes
  // from the accordion height animation on the children container — rows mount
  // together with their space, so there is no empty-gap-then-content artifact.
  const rowMotion = {
    initial: reduce ? false : { opacity: 0 },
    animate: {
      opacity: 1,
      transition: reduce ? { duration: 0 } : { duration: 0.15, ease: EASE_OUT },
    },
  };
  // Children container: height accordion (0 ↔ auto) for expand/collapse.
  const containerMotion = reduce
    ? {}
    : {
        initial: { height: 0, opacity: 0 },
        animate: { height: "auto", opacity: 1 },
        exit: { height: 0, opacity: 0 },
        transition: { duration: 0.25, ease: EASE_OUT },
      };
  // Vertical guide line at the parent's chevron column for nested rows.
  const branch =
    depth > 0 ? (
      <motion.span
        aria-hidden="true"
        initial={reduce ? false : { opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={reduce ? { duration: 0 } : BRANCH_DRAW}
        className="absolute top-0 bottom-0 w-px origin-top bg-border/70"
        style={{ left: (depth - 1) * 14 + 13 }}
      />
    ) : null;
  const expandedDirs = useStore((s) => s.expandedDirs);
  const toggleDir = useStore((s) => s.toggleDir);
  const openFile = useStore((s) => s.openFile);
  const activeTabId = useStore((s) => s.activeTabId);

  const [lazyChildren, setLazyChildren] = useState<FileNode[] | undefined>(node.children);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const treeVersion = useStore((s) => s.workspace.treeVersion);

  const isExpanded = expandedDirs.has(node.path);
  const isActive = activeTabId === node.path;
  const rowRef = useRef<HTMLDivElement>(null);

  // Keep the active file visible when it becomes active (open/switch).
  useEffect(() => {
    if (isActive) rowRef.current?.scrollIntoView({ block: "nearest" });
  }, [isActive]);

  // Tree reloaded: silently refetch children of EXPANDED dirs while keeping
  // the old ones visible (rows stay mounted — no flicker/remount). Skips when
  // no cached children yet — the first-expansion effect below covers that.
  const lastFetchVersion = useRef(-1);
  useEffect(() => {
    if (treeVersion === 0 || !node.isDir || !isExpanded) return;
    if (lazyChildren === undefined) return;
    if (lastFetchVersion.current >= treeVersion) return; // already fresh
    lastFetchVersion.current = treeVersion;
    markTreeRead();
    let cancelled = false;
    readDirectory(node.path, 1)
      .then((children) => !cancelled && setLazyChildren(children))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [treeVersion, node.isDir, node.path, isExpanded, lazyChildren]);

  // First expansion: fetch with loading state.
  useEffect(() => {
    if (isExpanded && node.isDir && lazyChildren === undefined && !loadingChildren) {
      setLoadingChildren(true);
      markTreeRead();
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

  const creating = useStore((s) => s.creating);
  const renamingPath = useStore((s) => s.renamingPath);
  const beginCreate = useStore((s) => s.beginCreate);
  const beginRename = useStore((s) => s.beginRename);
  const commitCreate = useStore((s) => s.commitCreate);
  const commitRename = useStore((s) => s.commitRename);
  const cancelFsEdit = useStore((s) => s.cancelFsEdit);
  const deleteNode = useStore((s) => s.deleteNode);

  const paddingLeft = depth * 14 + 6;

  const menu = (
    <ContextMenuContent ariaLabel={`${node.name} actions`}>
      <ContextMenuLabel>{node.name}</ContextMenuLabel>
      {node.isDir && (
        <>
          <ContextMenuItem onSelect={() => beginCreate(node.path, "file")}>
            <FilePlus2 aria-hidden="true" className="size-4" />
            New File
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => beginCreate(node.path, "dir")}>
            <FolderPlus aria-hidden="true" className="size-4" />
            New Folder
          </ContextMenuItem>
        </>
      )}
      <ContextMenuItem onSelect={() => beginRename(node.path)}>
        <Pencil aria-hidden="true" className="size-4" />
        Rename
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem tone="destructive" onSelect={() => deleteNode(node.path)}>
        <Trash2 aria-hidden="true" className="size-4" />
        Move to trash
      </ContextMenuItem>
    </ContextMenuContent>
  );

  if (renamingPath === node.path) {
    return (
      <NameInput
        depth={depth}
        initial={node.name}
        onCommit={(n) => commitRename(n)}
        onCancel={cancelFsEdit}
      />
    );
  }

  if (node.isDir) {
    return (
      <div>
        <motion.div {...rowMotion}>
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className="group relative flex cursor-pointer select-none items-center gap-1 py-0.75 pr-2 text-[13px] transition-colors hover:bg-sidebar-accent/50"
                style={{ paddingLeft }}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
              >
                {branch}
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={reduce ? { duration: 0 } : SPRING_SWAP}
                  className="grid size-3.5 shrink-0 place-items-center text-muted-foreground/70"
                >
                  <ChevronRight className="size-3.5" />
                </motion.span>
                <span className="relative grid size-4 shrink-0 place-items-center text-muted-foreground">
                  {reduce ? (
                    isExpanded ? (
                      <FolderOpen className="size-4" />
                    ) : (
                      <Folder className="size-4" />
                    )
                  ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.span
                        key={isExpanded ? "open" : "closed"}
                        initial={{ opacity: 0, scale: 0.75, rotate: isExpanded ? -8 : 8 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.75, rotate: isExpanded ? 8 : -8 }}
                        transition={SPRING_SWAP}
                        className="absolute inset-0 grid place-items-center"
                      >
                        {isExpanded ? (
                          <FolderOpen className="size-4" />
                        ) : (
                          <Folder className="size-4" />
                        )}
                      </motion.span>
                    </AnimatePresence>
                  )}
                </span>
                <span className="truncate">{node.name}</span>
              </div>
            </ContextMenuTrigger>
            {menu}
          </ContextMenu>
        </motion.div>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div key="children" {...containerMotion} className="overflow-hidden">
              {creating?.parentPath === node.path && (
                <NameInput
                  depth={depth + 1}
                  placeholder={creating.type === "file" ? "file name" : "folder name"}
                  onCommit={(n) => commitCreate(n)}
                  onCancel={cancelFsEdit}
                />
              )}
              {lazyChildren && lazyChildren.length > 0 && (
                <div>
                  {lazyChildren.map((child) => (
                    <FileTreeNode key={child.path} node={child} depth={depth + 1} />
                  ))}
                </div>
              )}
              {loadingChildren && (
                <div
                  className="py-1 text-muted-foreground/60 text-xs"
                  style={{ paddingLeft: paddingLeft + 20 }}
                >
                  Loading...
                </div>
              )}
              {!loadingChildren && lazyChildren && lazyChildren.length === 0 && (
                <div
                  className="py-1 text-muted-foreground/40 text-xs"
                  style={{ paddingLeft: paddingLeft + 20 }}
                >
                  Empty
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const FileIcon = getFileIcon(node.name);
  const fileColor = getFileColor(node.name);

  return (
    <motion.div {...rowMotion}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={rowRef}
            className={cn(
              "relative flex cursor-pointer select-none items-center gap-1 py-0.75 pr-2 text-[13px] transition-colors",
              isActive
                ? "bg-primary/12 font-medium text-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
            )}
            style={{ paddingLeft }}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
          >
            {branch}
            <span className="w-3.5 shrink-0" />
            <FileIcon className={cn("size-4 shrink-0", isActive ? "text-primary" : fileColor)} />
            <span className="truncate">{node.name}</span>
          </div>
        </ContextMenuTrigger>
        {menu}
      </ContextMenu>
    </motion.div>
  );
}
