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
  return path.substring(0, idx);
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
