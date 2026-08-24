import { useMemo } from "react";

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
