import { useEffect, useMemo, useState } from "react";
import { FilePlus2, FolderPlus } from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "@kumix/ui/motion/context-menu";
import { FileTreeNode, NameInput } from "@/components/explorer/file-tree-node";
import { readDirectory } from "@/lib/tauri-api";
import { markTreeRead, useStore } from "@/stores/app-store";
import type { FileNode } from "@/types";

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  if (!query) return nodes;
  const lower = query.toLowerCase();
  return nodes.reduce<FileNode[]>((acc, node) => {
    if (node.isDir) {
      const children = node.children ? filterTree(node.children, query) : [];
      const nameMatches = node.name.toLowerCase().includes(lower);
      if (nameMatches || children.length > 0) {
        acc.push({ ...node, children: node.children ? children : undefined });
      }
    } else {
      if (node.name.toLowerCase().includes(lower)) {
        acc.push(node);
      }
    }
    return acc;
  }, []);
}

export function FileTree() {
  const tree = useStore((s) => s.workspace.tree);
  const loading = useStore((s) => s.workspace.loading);
  const fileSearch = useStore((s) => s.fileSearch);
  const rootPath = useStore((s) => s.workspace.rootPath);
  const rootName = useStore((s) => s.workspace.rootName);

  // Lazy deep index: store tree is depth-1 (children expand lazily into local
  // state, invisible to filterTree). Fetch full tree once, only when the user
  // actually searches.
  // ponytail: depth 8 like Quick Open; incremental FS index if this ever gets slow.
  const [deepTree, setDeepTree] = useState<FileNode[] | null>(null);
  useEffect(() => {
    setDeepTree(null);
  }, []);
  useEffect(() => {
    if (!fileSearch.trim() || !rootPath || deepTree) return;
    let cancelled = false;
    markTreeRead();
    readDirectory(rootPath, 8)
      .then((t) => !cancelled && setDeepTree(t))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fileSearch, rootPath, deepTree]);
  const searchTree = deepTree ?? tree;
  const activeTabId = useStore((s) => s.activeTabId);

  // Switching tabs reveals the file in the tree: expand every ancestor dir.
  useEffect(() => {
    if (!rootPath || !activeTabId) return;
    const root = rootPath.replace(/\\/g, "/").replace(/\/$/, "");
    const file = activeTabId.replace(/\\/g, "/");
    if (!file.startsWith(`${root}/`)) return;
    const parts = file.slice(root.length + 1).split("/");
    const ancestors: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      ancestors.push(`${root}/${parts.slice(0, i).join("/")}`);
    }
    if (ancestors.length === 0) return;
    useStore.setState((s) => {
      const next = new Set(s.expandedDirs);
      let added = false;
      for (const a of ancestors)
        if (!next.has(a)) {
          next.add(a);
          added = true;
        }
      return added ? { expandedDirs: next } : {};
    });
  }, [activeTabId, rootPath]);

  const filteredTree = useMemo(() => filterTree(searchTree, fileSearch), [searchTree, fileSearch]);
  const creating = useStore((s) => s.creating);
  const beginCreate = useStore((s) => s.beginCreate);
  const commitCreate = useStore((s) => s.commitCreate);
  const cancelFsEdit = useStore((s) => s.cancelFsEdit);

  const newMenu = (
    <ContextMenuContent ariaLabel="Workspace actions">
      <ContextMenuLabel>{rootName ?? "Workspace"}</ContextMenuLabel>
      <ContextMenuItem onSelect={() => rootPath && beginCreate(rootPath, "file")}>
        <FilePlus2 aria-hidden="true" className="size-4" />
        New File
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => rootPath && beginCreate(rootPath, "dir")}>
        <FolderPlus aria-hidden="true" className="size-4" />
        New Folder
      </ContextMenuItem>
    </ContextMenuContent>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (filteredTree.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-muted-foreground text-sm">
        {fileSearch ? `No files matching "${fileSearch}"` : "No files found"}
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="py-1">
          {creating?.parentPath === rootPath && (
            <NameInput
              depth={0}
              placeholder={creating.type === "file" ? "file name" : "folder name"}
              onCommit={(n) => commitCreate(n)}
              onCancel={cancelFsEdit}
            />
          )}
          {filteredTree.map((node) => (
            <FileTreeNode key={node.path} node={node} depth={0} />
          ))}
        </div>
      </ContextMenuTrigger>
      {newMenu}
    </ContextMenu>
  );
}
