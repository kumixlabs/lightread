mod filesystem;
mod search;
mod watchers;

use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        // File-association support: a second instance started by "Open with
        // LightRead" forwards its argv to the running instance, focuses window, and exits.
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
            if let Err(e) = app.emit("single-instance", argv) {
                log::warn!("failed to forward single-instance args: {e}");
            }
        }))
        .manage(watchers::WatcherState::default())
        .setup(|app| {
            let log_builder = tauri_plugin_log::Builder::default().level(log::LevelFilter::Info);
            // Release builds log to a rotating file so bug reports are possible;
            // debug builds also log to stdout.
            let log_builder = if cfg!(debug_assertions) {
                log_builder.targets([tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                )])
            } else {
                use tauri::Manager;
                let dir = app
                    .path()
                    .app_log_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("."));
                log_builder.targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Folder {
                        path: dir,
                        file_name: None,
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
            };
            app.handle().plugin(log_builder.build())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            filesystem::read_text_file,
            filesystem::read_text_file_lossy,
            filesystem::write_text_file,
            filesystem::read_directory,
            filesystem::get_file_metadata,
            filesystem::file_exists,
            filesystem::get_cli_args,
            filesystem::create_file,
            filesystem::create_dir,
            filesystem::rename_path,
            filesystem::delete_path,
            filesystem::grant_asset_scope,
            watchers::start_file_watch,
            watchers::stop_file_watch,
            watchers::stop_all_watches,
            search::search_in_project,
        ])
        .build(tauri::generate_context!())
        .map_err(|e| e.to_string())
        .expect("error while building tauri application")
        .run(|_app, _event| {});
}
