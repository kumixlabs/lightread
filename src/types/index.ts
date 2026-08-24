export type FileCategory =
  | "code"
  | "text"
  | "document"
  | "data"
  | "image"
  | "svg"
  | "html"
  | "unsupported";

export type ViewerType =
  | "code"
  | "markdown"
  | "text"
  | "image"
  | "svg"
  | "html"
  | "csv"
  | "unsupported";

export interface FileTypeDefinition {
  id: string;
  extensions: string[];
  category: FileCategory;
  language?: string;
  viewer: ViewerType;
}

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  children?: FileNode[];
}

export interface LoadedFile {
  path: string;
  name: string;
  content: string;
  size: number;
  extension: string;
  viewerType: ViewerType;
  language?: string;
  category: FileCategory;
  modified?: number;
  truncated?: boolean;
  lossy?: boolean;
}

export interface Tab {
  id: string;
  file: LoadedFile;
  /** Live (possibly unsaved) content when the tab is editable. */
  draft?: string;
  /** Rendered preview vs editable source for markdown tabs. */
  previewMode?: boolean;
}

export interface RecentEntry {
  path: string;
  name: string;
  isDir: boolean;
  openedAt: number;
}

export type Theme = "light" | "dark" | "system";

export type CodeTheme =
  | "auto"
  | "github-dark"
  | "github-light"
  | "one-dark-pro"
  | "dracula"
  | "nord"
  | "vitesse-dark"
  | "vitesse-light"
  | "catppuccin-mocha"
  | "catppuccin-latte"
  | "monokai";

export interface AppSettings {
  theme: Theme;
  fontSize: number;
  lineHeight: number;
  sidebarWidth: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
  autoRefresh: boolean;
  codeTheme: CodeTheme;
  markdownDefaultMode: "source" | "preview";
}

/** Is this file editable in LightRead (plain text editing)? */
export function isEditable(viewerType: ViewerType): boolean {
  return viewerType === "text" || viewerType === "markdown";
}
