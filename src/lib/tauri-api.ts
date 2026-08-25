import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { openPath as openExternal } from "@tauri-apps/plugin-opener";

import { detectFileType } from "@/lib/file-types/registry";
import { basename, dirname, extname } from "@/lib/utils";
import type { FileNode, LoadedFile } from "@/types";

export interface RustFileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  children?: RustFileEntry[];
}

function convertNode(entry: RustFileEntry): FileNode {
  return {
    name: entry.name,
    path: entry.path,
    isDir: entry.is_dir,
    size: entry.size,
    children: entry.children?.map(convertNode),
  };
}

export async function readDirectory(path: string, maxDepth: number = 1): Promise<FileNode[]> {
  const entries = await invoke<RustFileEntry[]>("read_directory", { path, depth: 0, maxDepth });
  return entries.map(convertNode);
}

export async function readTextFile(path: string): Promise<string> {
  return invoke<string>("read_text_file", { path });
}

export async function readTextFileLossy(path: string): Promise<string> {
  return invoke<string>("read_text_file_lossy", { path });
}

export async function getFileMetadata(path: string) {
  return invoke<{
    size: number;
    is_dir: boolean;
    is_binary: boolean;
    modified: number | null;
    extension: string | null;
  }>("get_file_metadata", { path });
}

export async function fileExists(path: string): Promise<boolean> {
  return invoke<boolean>("file_exists", { path });
}

export async function getCliArgs(): Promise<string[]> {
  return invoke<string[]>("get_cli_args");
}

/** Grant asset-protocol access to a user-opened path (file or folder). */
export async function grantAssetScope(path: string, isDir: boolean): Promise<void> {
  await invoke("grant_asset_scope", { path, isDir });
}

export async function startFileWatch(path: string): Promise<void> {
  await invoke("start_file_watch", { path });
}

export async function stopFileWatch(path: string): Promise<void> {
  await invoke("stop_file_watch", { path });
}

export async function stopAllWatches(): Promise<void> {
  await invoke("stop_all_watches");
}

export interface SearchMatch {
  path: string;
  line: number;
  text: string;
}

export async function searchInProject(
  root: string,
  query: string,
  caseSensitive: boolean = false,
): Promise<SearchMatch[]> {
  return invoke<SearchMatch[]>("search_in_project", { root, query, caseSensitive });
}

export async function writeTextFile(path: string, contents: string): Promise<void> {
  await invoke("write_text_file", { path, contents });
}

export async function pickFile(): Promise<string | null> {
  const result = await openDialog({
    multiple: false,
    directory: false,
  });
  return typeof result === "string" ? result : null;
}

export async function pickSavePath(defaultName: string): Promise<string | null> {
  return saveDialog({ defaultPath: defaultName });
}

export async function pickFolder(): Promise<string | null> {
  const result = await openDialog({
    directory: true,
    multiple: false,
  });
  return typeof result === "string" ? result : null;
}

export async function openInDefaultApp(path: string): Promise<void> {
  await openExternal(path);
}

export function getFileUrl(path: string): string {
  return convertFileSrc(path);
}

export async function loadFile(path: string): Promise<LoadedFile> {
  const name = basename(path);
  const ext = extname(path);
  const typeDef = detectFileType(name);
  const meta = await getFileMetadata(path);

  const isStreamable =
    typeDef.category === "image" || typeDef.category === "svg" || typeDef.category === "media";

  if (meta.is_binary && !isStreamable) {
    return {
      path,
      name,
      content: "",
      size: meta.size,
      extension: ext,
      viewerType: "unsupported",
      category: "unsupported",
      modified: meta.modified ?? undefined,
    };
  }

  if (typeDef.viewer === "image" || typeDef.viewer === "media") {
    return {
      path,
      name,
      content: "",
      size: meta.size,
      extension: ext,
      viewerType: typeDef.viewer,
      category: typeDef.category,
      modified: meta.modified ?? undefined,
    };
  }

  let content: string;
  let lossy = false;
  try {
    content = await readTextFile(path);
  } catch {
    content = await readTextFileLossy(path);
    lossy = true;
  }

  const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;
  let truncated = false;
  if (content.length > LARGE_FILE_THRESHOLD) {
    content = content.slice(0, LARGE_FILE_THRESHOLD);
    truncated = true;
  }

  return {
    path,
    name,
    content,
    size: meta.size,
    extension: ext,
    viewerType: typeDef.viewer,
    language: typeDef.language,
    category: typeDef.category,
    modified: meta.modified ?? undefined,
    truncated,
    lossy,
  };
}

export async function resolveRelativeLink(
  currentFilePath: string,
  link: string,
): Promise<string | null> {
  if (
    !link ||
    link.startsWith("http://") ||
    link.startsWith("https://") ||
    link.startsWith("mailto:") ||
    link.startsWith("ftp://") ||
    link.startsWith("#")
  ) {
    return null;
  }

  const dir = dirname(currentFilePath);
  const normalizedDir = dir.replace(/\\/g, "/");
  const isUnixAbs = normalizedDir.startsWith("/");
  const dirParts = normalizedDir.split("/").filter(Boolean);
  const normalized = link.replace(/\\/g, "/").split("#")[0].replace(/^\.\//, "");

  if (normalized.startsWith("/")) {
    return null;
  }

  const parts = normalized.split("/");
  const resolvedParts = [...dirParts];
  const root = dirParts.length > 0 ? dirParts[0] : null; // Windows drive root like C:

  for (const part of parts) {
    if (part === "..") {
      // Never pop the drive root (last segment) on Windows-style paths.
      if (resolvedParts.length === 0 || (root !== null && resolvedParts.length === 1)) {
        return null;
      }
      resolvedParts.pop();
    } else if (part !== "." && part !== "") {
      resolvedParts.push(part);
    }
  }

  if (resolvedParts.length === 0) return null;
  return (isUnixAbs ? "/" : "") + resolvedParts.join("/");
}
