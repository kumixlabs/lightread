import type { FileCategory, FileTypeDefinition, ViewerType } from "@/types";

export const FILE_TYPES: FileTypeDefinition[] = [
  {
    id: "typescript",
    extensions: [".ts", ".tsx", ".mts", ".cts"],
    category: "code",
    language: "typescript",
    viewer: "code",
  },
  {
    id: "javascript",
    extensions: [".js", ".jsx", ".mjs", ".cjs"],
    category: "code",
    language: "javascript",
    viewer: "code",
  },
  {
    id: "json",
    extensions: [".json", ".jsonc"],
    category: "data",
    language: "json",
    viewer: "code",
  },
  { id: "json5", extensions: [".json5"], category: "data", language: "json5", viewer: "code" },
  { id: "jsonl", extensions: [".jsonl"], category: "data", language: "jsonl", viewer: "code" },
  { id: "yaml", extensions: [".yaml", ".yml"], category: "data", language: "yaml", viewer: "code" },
  { id: "toml", extensions: [".toml"], category: "data", language: "toml", viewer: "code" },
  {
    id: "xml",
    extensions: [".xml", ".xsl", ".xslt", ".xaml"],
    category: "data",
    language: "xml",
    viewer: "code",
  },
  {
    id: "html",
    extensions: [".html", ".htm", ".xhtml"],
    category: "html",
    language: "html",
    viewer: "html",
  },
  {
    id: "css",
    extensions: [".css", ".scss", ".sass", ".less", ".styl"],
    category: "code",
    language: "css",
    viewer: "code",
  },
  { id: "vue", extensions: [".vue"], category: "code", language: "vue", viewer: "code" },
  { id: "svelte", extensions: [".svelte"], category: "code", language: "svelte", viewer: "code" },
  { id: "astro", extensions: [".astro"], category: "code", language: "astro", viewer: "code" },
  {
    id: "php",
    extensions: [".php", ".phtml", ".php3", ".php4", ".php5"],
    category: "code",
    language: "php",
    viewer: "code",
  },
  {
    id: "python",
    extensions: [".py", ".pyw", ".pyi", ".pyx"],
    category: "code",
    language: "python",
    viewer: "code",
  },
  {
    id: "ruby",
    extensions: [".rb", ".erb", ".rake"],
    category: "code",
    language: "ruby",
    viewer: "code",
  },
  { id: "go", extensions: [".go"], category: "code", language: "go", viewer: "code" },
  { id: "rust", extensions: [".rs"], category: "code", language: "rust", viewer: "code" },
  {
    id: "java",
    extensions: [".java", ".class"],
    category: "code",
    language: "java",
    viewer: "code",
  },
  {
    id: "kotlin",
    extensions: [".kt", ".kts"],
    category: "code",
    language: "kotlin",
    viewer: "code",
  },
  {
    id: "csharp",
    extensions: [".cs", ".csx", ".csproj"],
    category: "code",
    language: "csharp",
    viewer: "code",
  },
  {
    id: "fsharp",
    extensions: [".fs", ".fsx", ".fsi"],
    category: "code",
    language: "fsharp",
    viewer: "code",
  },
  { id: "c", extensions: [".c", ".h"], category: "code", language: "c", viewer: "code" },
  {
    id: "cpp",
    extensions: [".cpp", ".hpp", ".cc", ".cxx", ".hxx", ".c++", ".h++"],
    category: "code",
    language: "cpp",
    viewer: "code",
  },
  {
    id: "objc",
    extensions: [".m", ".mm"],
    category: "code",
    language: "objective-c",
    viewer: "code",
  },
  {
    id: "shell",
    extensions: [".sh", ".bash", ".zsh", ".fish", ".ksh"],
    category: "code",
    language: "bash",
    viewer: "code",
  },
  {
    id: "powershell",
    extensions: [".ps1", ".psm1", ".psd1"],
    category: "code",
    language: "powershell",
    viewer: "code",
  },
  { id: "batch", extensions: [".bat", ".cmd"], category: "code", language: "bat", viewer: "code" },
  { id: "sql", extensions: [".sql", ".psql"], category: "data", language: "sql", viewer: "code" },
  {
    id: "dockerfile",
    extensions: ["dockerfile", ".dockerfile"],
    category: "code",
    language: "dockerfile",
    viewer: "code",
  },
  {
    id: "makefile",
    extensions: ["makefile", "mk"],
    category: "code",
    language: "makefile",
    viewer: "code",
  },
  {
    id: "markdown",
    extensions: [".md", ".mdx", ".markdown", ".rst"],
    category: "document",
    language: "markdown",
    viewer: "markdown",
  },
  {
    id: "text",
    extensions: [".txt", ".log", ".conf", ".cfg", ".ini", ".properties", ".env", ".lock"],
    category: "text",
    viewer: "text",
  },
  { id: "csv", extensions: [".csv", ".tsv"], category: "data", language: "csv", viewer: "csv" },
  {
    id: "graphql",
    extensions: [".graphql", ".gql"],
    category: "code",
    language: "graphql",
    viewer: "code",
  },
  {
    id: "hcl",
    extensions: [".hcl", ".tf", ".tfvars"],
    category: "code",
    language: "hcl",
    viewer: "code",
  },
  { id: "prisma", extensions: [".prisma"], category: "code", language: "prisma", viewer: "code" },
  { id: "lua", extensions: [".lua", ".luau"], category: "code", language: "lua", viewer: "code" },
  { id: "dart", extensions: [".dart"], category: "code", language: "dart", viewer: "code" },
  { id: "swift", extensions: [".swift"], category: "code", language: "swift", viewer: "code" },
  {
    id: "scala",
    extensions: [".scala", ".sbt"],
    category: "code",
    language: "scala",
    viewer: "code",
  },
  {
    id: "r",
    extensions: [".r", ".rdata", ".rds"],
    category: "code",
    language: "r",
    viewer: "code",
  },
  {
    id: "haskell",
    extensions: [".hs", ".lhs"],
    category: "code",
    language: "haskell",
    viewer: "code",
  },
  {
    id: "elixir",
    extensions: [".ex", ".exs", ".eex", ".leex"],
    category: "code",
    language: "elixir",
    viewer: "code",
  },
  {
    id: "erlang",
    extensions: [".erl", ".hrl"],
    category: "code",
    language: "erlang",
    viewer: "code",
  },
  { id: "zig", extensions: [".zig", ".zon"], category: "code", language: "zig", viewer: "code" },
  { id: "nim", extensions: [".nim", ".nims"], category: "code", language: "nim", viewer: "code" },
  {
    id: "ocaml",
    extensions: [".ml", ".mli", ".mll", ".mly"],
    category: "code",
    language: "ocaml",
    viewer: "code",
  },
  {
    id: "perl",
    extensions: [".pl", ".pm", ".t"],
    category: "code",
    language: "perl",
    viewer: "code",
  },
  {
    id: "protobuf",
    extensions: [".proto"],
    category: "code",
    language: "protobuf",
    viewer: "code",
  },
  { id: "solidity", extensions: [".sol"], category: "code", language: "solidity", viewer: "code" },
  { id: "vim", extensions: [".vim", ".vimrc"], category: "code", language: "viml", viewer: "code" },
  { id: "asm", extensions: [".asm", ".s"], category: "code", language: "asm6502", viewer: "code" },
  {
    id: "nginx",
    extensions: [".nginx", ".nginxconf"],
    category: "code",
    language: "nginx",
    viewer: "code",
  },
  {
    id: "latex",
    extensions: [".tex", ".latex", ".sty", ".bib"],
    category: "text",
    language: "latex",
    viewer: "code",
  },
  { id: "nix", extensions: [".nix"], category: "code", language: "nix", viewer: "code" },
  { id: "cmake", extensions: [".cmake"], category: "code", language: "cmake", viewer: "code" },
  {
    id: "coffee",
    extensions: [".coffee", ".litcoffee"],
    category: "code",
    language: "coffeescript",
    viewer: "code",
  },
  {
    id: "clojure",
    extensions: [".clj", ".cljs", ".cljc", ".edn"],
    category: "code",
    language: "clojure",
    viewer: "code",
  },
  {
    id: "diff",
    extensions: [".diff", ".patch"],
    category: "data",
    language: "diff",
    viewer: "code",
  },
  {
    id: "pascal",
    extensions: [".pas", ".pp"],
    category: "code",
    language: "pascal",
    viewer: "code",
  },
  {
    id: "fortran",
    extensions: [".f", ".for", ".f90", ".f95", ".f03"],
    category: "code",
    language: "fortran-fixed-form",
    viewer: "code",
  },
  {
    id: "groovy",
    extensions: [".groovy", ".gvy", ".gradle"],
    category: "code",
    language: "groovy",
    viewer: "code",
  },
  { id: "julia", extensions: [".jl"], category: "code", language: "julia", viewer: "code" },
  { id: "wgsl", extensions: [".wgsl"], category: "code", language: "wgsl", viewer: "code" },
  { id: "typst", extensions: [".typ"], category: "code", language: "typst", viewer: "code" },
  { id: "cue", extensions: [".cue"], category: "code", language: "cue", viewer: "code" },
  {
    id: "apex",
    extensions: [".cls", ".trigger"],
    category: "code",
    language: "apex",
    viewer: "code",
  },
  { id: "matlab", extensions: [".m"], category: "code", language: "matlab", viewer: "code" },
  {
    id: "handlebars",
    extensions: [".hbs", ".handlebars"],
    category: "code",
    language: "handlebars",
    viewer: "code",
  },
  {
    id: "jinja",
    extensions: [".jinja", ".jinja2", ".j2"],
    category: "code",
    language: "jinja",
    viewer: "code",
  },
  { id: "twig", extensions: [".twig"], category: "code", language: "twig", viewer: "code" },
];

const DOTFILE_MAP: Record<
  string,
  { category: FileCategory; viewer: ViewerType; language?: string }
> = {
  ".env": { category: "text", viewer: "text" },
  ".env.example": { category: "text", viewer: "text" },
  ".env.local": { category: "text", viewer: "text" },
  ".env.production": { category: "text", viewer: "text" },
  ".env.development": { category: "text", viewer: "text" },
  ".gitignore": { category: "text", viewer: "text" },
  ".dockerignore": { category: "text", viewer: "text" },
  ".npmignore": { category: "text", viewer: "text" },
  ".eslintignore": { category: "text", viewer: "text" },
  ".prettierignore": { category: "text", viewer: "text" },
  ".prettierrc": { category: "data", viewer: "code", language: "json" },
  ".eslintrc": { category: "data", viewer: "code", language: "json" },
  ".editorconfig": { category: "text", viewer: "text" },
  ".gitattributes": { category: "text", viewer: "text" },
  ".gitmodules": { category: "text", viewer: "text" },
  ".npmrc": { category: "text", viewer: "text" },
  ".nvmrc": { category: "text", viewer: "text" },
  ".node-version": { category: "text", viewer: "text" },
  ".ruby-version": { category: "text", viewer: "text" },
  ".python-version": { category: "text", viewer: "text" },
  ".tool-versions": { category: "text", viewer: "text" },
  ".terraform-version": { category: "text", viewer: "text" },
  ".gitconfig": { category: "text", viewer: "text" },
  ".browserslistrc": { category: "text", viewer: "text" },
};

const DOTFILE_JSON_VARIANTS = new Set([
  ".eslintrc.json",
  ".eslintrc.cjs",
  ".eslintrc.mjs",
  ".eslintrc.js",
  ".prettierrc.json",
  ".prettierrc.cjs",
  ".prettierrc.mjs",
  ".prettierrc.js",
  ".stylelintrc.json",
  ".stylelintrc.cjs",
  ".stylelintrc.mjs",
  ".stylelintrc.js",
  ".babelrc",
  ".swcrc",
]);

const DOTFILE_YAML_VARIANTS = new Set([
  ".eslintrc.yaml",
  ".eslintrc.yml",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".stylelintrc.yaml",
  ".stylelintrc.yml",
]);

const NAMED_FILES: Record<string, FileTypeDefinition> = {
  dockerfile: {
    id: "dockerfile",
    extensions: ["dockerfile"],
    category: "code",
    language: "dockerfile",
    viewer: "code",
  },
  makefile: {
    id: "makefile",
    extensions: ["makefile"],
    category: "code",
    language: "makefile",
    viewer: "code",
  },
  gnumakefile: {
    id: "makefile",
    extensions: ["makefile"],
    category: "code",
    language: "makefile",
    viewer: "code",
  },
  gemfile: {
    id: "ruby",
    extensions: ["gemfile"],
    category: "code",
    language: "ruby",
    viewer: "code",
  },
  rakefile: {
    id: "ruby",
    extensions: ["rakefile"],
    category: "code",
    language: "ruby",
    viewer: "code",
  },
  procfile: {
    id: "text",
    extensions: ["procfile"],
    category: "text",
    viewer: "text",
  },
  vagrantfile: {
    id: "ruby",
    extensions: ["vagrantfile"],
    category: "code",
    language: "ruby",
    viewer: "code",
  },
  license: {
    id: "markdown",
    extensions: [".md"],
    category: "document",
    language: "markdown",
    viewer: "markdown",
  },
  "license.txt": {
    id: "markdown",
    extensions: [".md"],
    category: "document",
    language: "markdown",
    viewer: "markdown",
  },
  "license.md": {
    id: "markdown",
    extensions: [".md"],
    category: "document",
    language: "markdown",
    viewer: "markdown",
  },
  "cmakelists.txt": {
    id: "cmake",
    extensions: [".txt"],
    category: "code",
    language: "cmake",
    viewer: "code",
  },
};

const BINARY_EXTENSIONS = new Set([
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".a",
  ".lib",
  ".o",
  ".obj",
  ".zip",
  ".7z",
  ".rar",
  ".tar",
  ".gz",
  ".bz2",
  ".xz",
  ".lz4",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".ttf",
  ".otf",
  ".woff",
  ".woff2",
  ".eot",
  ".jar",
  ".war",
  ".class",
  ".wasm",
  ".bin",
  ".dat",
  ".db",
  ".sqlite",
  ".mdb",
  ".pak",
  ".apk",
  ".ipa",
  ".dmg",
  ".iso",
]);

// ponytail: WebView2/WebKit ship their own codec sets (mp4/h264/aac/mp3/webm OK;
// mkv/avi/flv often fail) — unsupported ones fall back to an error card in the player.
const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".ogg",
  ".wma",
  ".m4a",
  ".opus",
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".m4v",
  ".mov",
  ".webm",
  ".avi",
  ".mkv",
  ".flv",
  ".wmv",
  ".mpg",
  ".mpeg",
  ".ts",
  ".3gp",
]);
const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
  ".ico",
  ".avif",
  ".tiff",
  ".tif",
]);

export function getExtension(filename: string): string {
  const lower = filename.toLowerCase();
  const dotIdx = lower.lastIndexOf(".");
  if (dotIdx <= 0) return "";
  return lower.substring(dotIdx);
}

export function detectFileType(filename: string): FileTypeDefinition {
  const lower = filename.toLowerCase();

  if (NAMED_FILES[lower]) return NAMED_FILES[lower];

  if (DOTFILE_MAP[lower]) {
    const def = DOTFILE_MAP[lower];
    return {
      id: lower,
      extensions: [lower],
      category: def.category,
      language: def.language,
      viewer: def.viewer,
    };
  }

  if (DOTFILE_JSON_VARIANTS.has(lower)) {
    return { id: lower, extensions: [lower], category: "data", language: "json", viewer: "code" };
  }
  if (DOTFILE_YAML_VARIANTS.has(lower)) {
    return { id: lower, extensions: [lower], category: "data", language: "yaml", viewer: "code" };
  }

  const ext = getExtension(lower);

  if (ext === ".svg") {
    return { id: "svg", extensions: [".svg"], category: "svg", language: "xml", viewer: "svg" };
  }

  for (const def of FILE_TYPES) {
    if (def.extensions.includes(ext)) {
      return def;
    }
  }

  if (IMAGE_EXTENSIONS.has(ext)) {
    return { id: "image", extensions: [ext], category: "image", viewer: "image" };
  }

  if (AUDIO_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext)) {
    return {
      id: VIDEO_EXTENSIONS.has(ext) ? "video" : "audio",
      extensions: [ext],
      category: "media",
      viewer: "media",
    };
  }

  if (BINARY_EXTENSIONS.has(ext)) {
    return { id: "unsupported", extensions: [ext], category: "unsupported", viewer: "unsupported" };
  }

  return { id: "text", extensions: [ext], category: "text", viewer: "text" };
}

export function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(getExtension(filename));
}

export function isBinaryExtension(filename: string): boolean {
  return BINARY_EXTENSIONS.has(getExtension(filename));
}
