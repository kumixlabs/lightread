export { cn } from "@kumix/utils";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function basename(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path;
}

export function dirname(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  if (idx === -1) return "";
  // Slice the NORMALIZED string — slicing the original leaks a trailing `\`
  // when separator counts differ between the two forms.
  return normalized.slice(0, idx);
}

export function extname(path: string): string {
  const base = basename(path);
  const idx = base.lastIndexOf(".");
  if (idx <= 0) return "";
  return base.substring(idx).toLowerCase();
}

export function relativePath(fullPath: string, basePath: string): string {
  const normalizedFull = fullPath.replace(/\\/g, "/");
  const normalizedBase = basePath.replace(/\\/g, "/").replace(/\/$/, "");
  if (normalizedFull.startsWith(`${normalizedBase}/`)) {
    return normalizedFull.substring(normalizedBase.length + 1);
  }
  if (normalizedFull === normalizedBase) return "";
  return fullPath;
}

export function joinPath(base: string, relative: string): string {
  return `${base.replace(/\\/g, "/").replace(/\/$/, "")}/${relative}`;
}

/**
 * Resolve a relative link ("./x", "../y") against a file path → normalized
 * `/`-separated path. Returns null for URLs, anchors, absolute links, or links
 * that escape the root/drive. Sync core shared by markdown links and images.
 */
export function resolveRelative(currentFilePath: string, link: string): string | null {
  if (!link || /^(https?|mailto|ftp|asset|data):/i.test(link) || link.startsWith("#")) {
    return null;
  }
  const normalizedDir = dirname(currentFilePath).replace(/\\/g, "/");
  const isUnixAbs = normalizedDir.startsWith("/");
  const dirParts = normalizedDir.split("/").filter(Boolean);
  const normalized = link.replace(/\\/g, "/").split("#")[0].replace(/^\.\//, "");
  if (normalized.startsWith("/")) return null;
  const parts = normalized.split("/");
  const resolvedParts = [...dirParts];
  const root = dirParts.length > 0 ? dirParts[0] : null; // Windows drive root like C:
  for (const part of parts) {
    if (part === "..") {
      // Never pop the drive root (first segment) on Windows-style paths.
      if (resolvedParts.length === 0 || (root !== null && resolvedParts.length === 1)) return null;
      resolvedParts.pop();
    } else if (part !== "." && part !== "") {
      resolvedParts.push(part);
    }
  }
  if (resolvedParts.length === 0) return null;
  return (isUnixAbs ? "/" : "") + resolvedParts.join("/");
}

export function findMatches(content: string, query: string, caseSensitive: boolean): number[] {
  if (!query || !content) return [];
  const flags = caseSensitive ? "g" : "gi";
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, flags);
  const result: number[] = [];
  let m = regex.exec(content);
  while (m !== null) {
    result.push(m.index);
    if (m.index === regex.lastIndex) regex.lastIndex++;
    m = regex.exec(content);
  }
  return result;
}
