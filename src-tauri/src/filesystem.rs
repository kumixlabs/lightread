use std::io::Read;
use std::path::Path;

#[derive(Debug, Clone, serde::Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub children: Option<Vec<FileEntry>>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FileMetadata {
    pub size: u64,
    pub is_dir: bool,
    pub is_binary: bool,
    pub modified: Option<f64>,
    pub extension: Option<String>,
}

pub const MAX_TEXT_SIZE: u64 = 100 * 1024 * 1024;

const IGNORED_DIRS: &[&str] = &[
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    "target",
    "__pycache__",
    ".venv",
    "venv",
    ".idea",
    ".vscode",
    ".cache",
    "coverage",
    ".turbo",
];

pub fn should_ignore(name: &str) -> bool {
    IGNORED_DIRS.contains(&name)
}

pub fn is_binary_start(bytes: &[u8]) -> bool {
    if bytes.is_empty() {
        return false;
    }
    if bytes.starts_with(&[0xFF, 0xD8])
        || bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47])
        || bytes.starts_with(&[0x47, 0x49, 0x46, 0x38])
        || bytes.starts_with(&[0x42, 0x4D])
        || bytes.starts_with(&[0x49, 0x49, 0x2A, 0x00])
        || bytes.starts_with(&[0x4D, 0x5A])
        || bytes.starts_with(&[0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C])
        || bytes.starts_with(&[0x50, 0x4B, 0x03, 0x04])
        || bytes.starts_with(&[0x52, 0x61, 0x72, 0x21])
    {
        return true;
    }
    let check_len = bytes.len().min(8192);
    let chunk = &bytes[..check_len];
    let control_count = chunk
        .iter()
        .filter(|&&b| b == 0 || (b < 0x09) || (b > 0x0D && b < 0x20))
        .count();
    let ratio = control_count as f32 / check_len as f32;
    ratio > 0.1
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    let path = Path::new(&path);
    let metadata = std::fs::metadata(path).map_err(|e| e.to_string())?;
    if metadata.len() > MAX_TEXT_SIZE {
        return Err(format!(
            "File too large: {} MB (max {} MB)",
            metadata.len() / 1024 / 1024,
            MAX_TEXT_SIZE / 1024 / 1024
        ));
    }
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    if is_binary_start(&bytes) {
        return Err("binary_file".to_string());
    }
    String::from_utf8(bytes).map_err(|_| "encoding_error".to_string())
}

#[tauri::command]
pub fn read_text_file_lossy(path: String) -> Result<String, String> {
    let path = Path::new(&path);
    let metadata = std::fs::metadata(path).map_err(|e| e.to_string())?;
    if metadata.len() > MAX_TEXT_SIZE {
        return Err("File too large".to_string());
    }
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        return Ok(String::from_utf8_lossy(&bytes[3..]).into_owned());
    }
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(Path::new(&path), contents.as_bytes()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_directory(path: String, depth: u32, max_depth: u32) -> Result<Vec<FileEntry>, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err("Not a directory".to_string());
    }
    let mut entries: Vec<FileEntry> = Vec::new();

    let read_dir = std::fs::read_dir(dir).map_err(|e| e.to_string())?;
    let mut all_entries: Vec<_> = read_dir.filter_map(|e| e.ok()).collect();
    all_entries.sort_by(|a, b| {
        let a_is_dir = a.file_type().map(|t| t.is_dir()).unwrap_or(false);
        let b_is_dir = b.file_type().map(|t| t.is_dir()).unwrap_or(false);
        match (a_is_dir, b_is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.file_name().cmp(&b.file_name()),
        }
    });

    for entry in all_entries {
        let name = entry.file_name().to_string_lossy().into_owned();
        if should_ignore(&name) {
            continue;
        }
        let entry_path = entry.path();
        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);

        let children = if is_dir && depth < max_depth {
            read_directory(
                entry_path.to_string_lossy().into_owned(),
                depth + 1,
                max_depth,
            )
            .ok()
        } else {
            None
        };

        entries.push(FileEntry {
            name,
            path: entry_path.to_string_lossy().into_owned(),
            is_dir,
            size,
            children,
        });
    }

    Ok(entries)
}

#[tauri::command]
pub fn get_file_metadata(path: String) -> Result<FileMetadata, String> {
    let path = Path::new(&path);
    let metadata = std::fs::metadata(path).map_err(|e| e.to_string())?;

    let is_binary = if metadata.is_dir() {
        false
    } else {
        let file = std::fs::File::open(path).map_err(|e| e.to_string())?;
        let mut reader = std::io::BufReader::new(file);
        let mut buf = [0u8; 8192];
        let n = reader.read(&mut buf).unwrap_or(0);
        is_binary_start(&buf[..n])
    };

    Ok(FileMetadata {
        size: metadata.len(),
        is_dir: metadata.is_dir(),
        is_binary,
        modified: metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs_f64()),
        extension: path
            .extension()
            .map(|e| e.to_string_lossy().into_owned()),
    })
}

#[tauri::command]
pub fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[tauri::command]
pub fn get_cli_args() -> Vec<String> {
    std::env::args().skip(1).collect()
}

/// Grant asset-protocol scope for a user-opened file/folder. Static scopes
/// cannot cover "open anything from anywhere" — the user action here is the
/// authorization.
#[tauri::command]
pub fn grant_asset_scope(
    app: tauri::AppHandle,
    path: String,
    is_dir: bool,
) -> Result<(), String> {
    use tauri::Manager;
    let scopes = app.state::<tauri::scope::Scopes>();
    if is_dir {
        scopes.allow_directory(&path, true)
    } else {
        scopes.allow_file(&path)
    }
    .map_err(|e| e.to_string())
}
