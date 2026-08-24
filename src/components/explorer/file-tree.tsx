import { useEffect, useMemo } from "react";

import { FileTreeNode } from "@/components/explorer/file-tree-node";
import { useStore } from "@/stores/app-store";
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

  const filteredTree = useMemo(() => filterTree(tree, fileSearch), [tree, fileSearch]);

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
    <div className="py-1">
      {filteredTree.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}
