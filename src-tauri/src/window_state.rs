use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewWindow};

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct WindowState {
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub maximized: bool,
}

pub struct WindowStateManager {
    state: Mutex<WindowState>,
    last_saved: AtomicU64,
}

impl Default for WindowStateManager {
    fn default() -> Self {
        Self {
            state: Mutex::new(WindowState::default()),
            last_saved: AtomicU64::new(0),
        }
    }
}

pub fn get_window_state_path(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app.path().config_dir().map_err(|e| e.to_string())?;
    Ok(base.join("lightread").join("window-state.json"))
}

pub fn restore_window_state(window: &WebviewWindow) {
    let app = window.app_handle();
    let state_path = match get_window_state_path(app) {
        Ok(p) => p,
        Err(_) => return,
    };

    let content = if state_path.exists() {
        std::fs::read_to_string(&state_path).ok()
    } else {
        let candidates = [
            app.path()
                .config_dir()
                .map(|b| b.join("LightRead").join("window-state.json")),
            app.path()
                .app_config_dir()
                .map(|b| b.join("window-state.json")),
        ];
        candidates
            .into_iter()
            .flatten()
            .find(|p| p.exists())
            .and_then(|p| std::fs::read_to_string(p).ok())
    };

    let content = match content {
        Some(c) => c,
        None => return,
    };

    let state: WindowState = match serde_json::from_str(&content) {
        Ok(s) => s,
        Err(_) => return,
    };

    if let Some(mgr) = window.try_state::<WindowStateManager>() {
        if let Ok(mut current) = mgr.state.lock() {
            *current = state.clone();
        }
    }

    if state.width > 0 && state.height > 0 {
        let _ = window.set_size(PhysicalSize::new(state.width, state.height));
    }

    if let Ok(monitors) = window.available_monitors() {
        let pos = PhysicalPosition::new(state.x, state.y);
        let size = PhysicalSize::new(state.width.max(100), state.height.max(100));
        let on_screen = monitors.iter().any(|m| {
            let m_pos = m.position();
            let m_size = m.size();
            pos.x < m_pos.x + m_size.width as i32
                && pos.x + size.width as i32 > m_pos.x
                && pos.y < m_pos.y + m_size.height as i32
                && pos.y + size.height as i32 > m_pos.y
        });
        if on_screen {
            let _ = window.set_position(pos);
        }
    }

    if state.maximized {
        let _ = window.maximize();
    }
}

pub fn update_window_geometry(window: &WebviewWindow, force_flush: bool) {
    let app = window.app_handle();
    let mgr = match window.try_state::<WindowStateManager>() {
        Some(m) => m,
        None => return,
    };

    let is_maximized = window.is_maximized().unwrap_or(false);
    let is_minimized = window.is_minimized().unwrap_or(false);

    if is_minimized {
        return;
    }

    let to_save = {
        let mut cur = match mgr.state.lock() {
            Ok(c) => c,
            Err(_) => return,
        };

        cur.maximized = is_maximized;

        if !is_maximized {
            if let Ok(size) = window.inner_size() {
                if size.width > 0 && size.height > 0 {
                    cur.width = size.width;
                    cur.height = size.height;
                }
            }
            if let Ok(pos) = window.outer_position() {
                cur.x = pos.x;
                cur.y = pos.y;
            }
        }

        cur.clone()
    };

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let last = mgr.last_saved.load(Ordering::Relaxed);
    if force_flush || now.saturating_sub(last) >= 1 {
        mgr.last_saved.store(now, Ordering::Relaxed);
        if let Ok(path) = get_window_state_path(app) {
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            if let Ok(json) = serde_json::to_string(&to_save) {
                let _ = std::fs::write(path, json);
            }
        }
    }
}

#[tauri::command]
pub fn reset_window_state(app: AppHandle, window: WebviewWindow) -> Result<(), String> {
    if let Ok(path) = get_window_state_path(&app) {
        let _ = std::fs::remove_file(path);
    }
    if let Some(mgr) = window.try_state::<WindowStateManager>() {
        if let Ok(mut cur) = mgr.state.lock() {
            *cur = WindowState::default();
        }
    }
    let _ = window.unmaximize();
    let _ = window.set_size(tauri::LogicalSize::new(1200.0, 800.0));
    let _ = window.center();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_window_state_serde() {
        let state = WindowState {
            width: 1440,
            height: 900,
            x: 100,
            y: 50,
            maximized: true,
        };
        let json = serde_json::to_string(&state).unwrap();
        let parsed: WindowState = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.width, 1440);
        assert_eq!(parsed.height, 900);
        assert_eq!(parsed.x, 100);
        assert_eq!(parsed.y, 50);
        assert!(parsed.maximized);
    }
}

