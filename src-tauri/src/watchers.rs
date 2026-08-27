use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Emitter, State};

type WatcherMap = Mutex<HashMap<String, Box<dyn std::any::Any + Send>>>;

#[derive(Default)]
pub struct WatcherState {
    pub watchers: WatcherMap,
}

#[tauri::command]
pub fn start_file_watch(
    path: String,
    recursive: Option<bool>,
    app: tauri::AppHandle,
    state: State<WatcherState>,
) -> Result<(), String> {
    let watch_path = PathBuf::from(&path);
    let event_path = path.clone();
    let recursive = recursive.unwrap_or(false);
    // Recursive watch (workspace tree) emits a distinct event so the frontend
    // refreshes the tree instead of flagging a single tab file as changed.
    let event_name: &'static str = if recursive { "tree-changed" } else { "file-changed" };

    let mut debouncer = notify_debouncer_mini::new_debouncer(
        std::time::Duration::from_millis(500),
        move |res: notify_debouncer_mini::DebounceEventResult| {
            // ponytail: debouncer-mini gives no event kinds; if remove-vs-write
            // filtering ever matters, switch to notify-debouncer-full.
            if res.is_ok() {
                let _ = app.emit(event_name, &event_path);
            }
        },
    )
    .map_err(|e| e.to_string())?;

    debouncer
        .watcher()
        .watch(
            &watch_path,
            if recursive {
                notify_debouncer_mini::notify::RecursiveMode::Recursive
            } else {
                notify_debouncer_mini::notify::RecursiveMode::NonRecursive
            },
        )
        .map_err(|e| e.to_string())?;

    let mut watchers = state.watchers.lock().map_err(|e| e.to_string())?;
    watchers.insert(path, Box::new(debouncer));

    Ok(())
}

#[tauri::command]
pub fn stop_file_watch(path: String, state: State<WatcherState>) -> Result<(), String> {
    let mut watchers = state.watchers.lock().map_err(|e| e.to_string())?;
    watchers.remove(&path);
    Ok(())
}

#[tauri::command]
pub fn stop_all_watches(state: State<WatcherState>) -> Result<(), String> {
    let mut watchers = state.watchers.lock().map_err(|e| e.to_string())?;
    watchers.clear();
    Ok(())
}
