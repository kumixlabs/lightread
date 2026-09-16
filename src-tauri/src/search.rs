use std::path::Path;

use crate::filesystem::{is_binary_start, should_ignore};

#[derive(serde::Serialize)]
pub struct SearchMatch {
    pub path: String,
    pub line: usize,
    pub text: String,
}

#[tauri::command]
pub async fn search_in_project(
    root: String,
    query: String,
    case_sensitive: bool,
) -> Result<Vec<SearchMatch>, String> {
    if query.is_empty() {
        return Ok(Vec::new());
    }
    // Offload to a blocking thread so large repos don't stall the Tauri thread pool.
    tauri::async_runtime::spawn_blocking(move || {
        let root_path = Path::new(&root);
        if !root_path.is_dir() {
            return Err("Root is not a directory".to_string());
        }
        let mut results = Vec::new();
        let query_lower = if case_sensitive {
            String::new()
        } else {
            query.to_lowercase()
        };
        let mut seen = std::collections::HashSet::new();
        if let Ok(canon) = root_path.canonicalize() {
            seen.insert(canon);
        }
        search_dir(
            root_path,
            &query,
            &query_lower,
            case_sensitive,
            &mut results,
            500,
            &mut seen,
        );
        Ok(results)
    })
    .await
    .map_err(|e| e.to_string())?
}

fn search_dir(
    dir: &Path,
    query: &str,
    query_lower: &str,
    case_sensitive: bool,
    results: &mut Vec<SearchMatch>,
    max_results: usize,
    seen: &mut std::collections::HashSet<std::path::PathBuf>,
) {
    if results.len() >= max_results {
        return;
    }
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        if results.len() >= max_results {
            return;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        if should_ignore(&name) || name.starts_with('.') {
            continue;
        }
        let path = entry.path();
        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
        if is_dir {
            let canon = path.canonicalize().unwrap_or_else(|_| path.clone());
            if seen.insert(canon) {
                search_dir(
                    &path,
                    query,
                    query_lower,
                    case_sensitive,
                    results,
                    max_results,
                    seen,
                );
            }
        } else {
            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };
            if metadata.len() > 5 * 1024 * 1024 {
                continue;
            }
            search_file(&path, query, query_lower, case_sensitive, results, max_results);
        }
    }
}

fn search_file(
    path: &Path,
    query: &str,
    query_lower: &str,
    case_sensitive: bool,
    results: &mut Vec<SearchMatch>,
    max_results: usize,
) {
    let bytes = match std::fs::read(path) {
        Ok(b) => b,
        Err(_) => return,
    };
    if is_binary_start(&bytes) {
        return;
    }
    let content = String::from_utf8_lossy(&bytes);
    for (line_num, line) in content.lines().enumerate() {
        if results.len() >= max_results {
            return;
        }
        // Fast path: case-sensitive search needs no per-line allocation.
        let hit = if case_sensitive {
            line.contains(&query[..])
        } else {
            line.to_lowercase().contains(query_lower)
        };
        if hit {
            let trimmed = if line.len() > 300 {
                let mut end = 300;
                while !line.is_char_boundary(end) {
                    end -= 1;
                }
                format!("{}...", &line[..end])
            } else {
                line.to_string()
            };
            results.push(SearchMatch {
                path: path.to_string_lossy().into_owned(),
                line: line_num + 1,
                text: trimmed,
            });
        }
    }
}
