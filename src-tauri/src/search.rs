use std::path::Path;

use crate::filesystem::{is_binary_start, should_ignore};

#[derive(serde::Serialize)]
pub struct SearchMatch {
    pub path: String,
    pub line: usize,
    pub text: String,
}

#[tauri::command]
pub fn search_in_project(
    root: String,
    query: String,
    case_sensitive: bool,
) -> Result<Vec<SearchMatch>, String> {
    if query.is_empty() {
        return Ok(Vec::new());
    }
    let root_path = Path::new(&root);
    if !root_path.is_dir() {
        return Err("Root is not a directory".to_string());
    }
    let mut results = Vec::new();
    search_dir(root_path, &query, case_sensitive, &mut results, 500);
    Ok(results)
}

fn search_dir(
    dir: &Path,
    query: &str,
    case_sensitive: bool,
    results: &mut Vec<SearchMatch>,
    max_results: usize,
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
            search_dir(&path, query, case_sensitive, results, max_results);
        } else {
            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };
            if metadata.len() > 5 * 1024 * 1024 {
                continue;
            }
            search_file(&path, query, case_sensitive, results, max_results);
        }
    }
}

fn search_file(
    path: &Path,
    query: &str,
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
    let search_str = if case_sensitive {
        query.to_string()
    } else {
        query.to_lowercase()
    };
    for (line_num, line) in content.lines().enumerate() {
        if results.len() >= max_results {
            return;
        }
        let line_cmp = if case_sensitive {
            line.to_string()
        } else {
            line.to_lowercase()
        };
        if line_cmp.contains(&search_str) {
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
