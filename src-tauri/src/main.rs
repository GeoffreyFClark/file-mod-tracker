#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::collections::{HashMap, HashSet, BTreeMap};
use std::ffi::OsStr;
use std::fs::metadata as get_metadata;
use std::io::ErrorKind;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::sync::mpsc::{channel, Sender};
use std::thread;
use std::time::{Duration, Instant};

use chrono::{DateTime, Utc};
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Result as NotifyResult, Watcher};
use tauri::Manager;
use winapi::um::fileapi::GetFileAttributesW;
use winapi::um::winnt::{
    FILE_ATTRIBUTE_ENCRYPTED, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_TEMPORARY,
};
use chrono::NaiveDateTime;

/// Retrieves file attributes for a given path using GetFileAttributesW from winapi,
/// converting the path to UTF-16. Returns the attribute bitmask (u32) or an error message.
fn get_file_attributes(file_path: &str) -> Result<u32, String> {
    let path_wide: Vec<u16> = OsStr::new(file_path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        let attributes = GetFileAttributesW(path_wide.as_ptr());
        if attributes != u32::MAX {
            Ok(attributes)
        } else {
            let err = std::io::Error::last_os_error();
            match err.kind() {
                ErrorKind::PermissionDenied => Err("Access Denied".to_string()),
                ErrorKind::NotFound => Err("File Not Found".to_string()),
                _ => Err(format!("Error: {}", err)),
            }
        }
    }
}

/// Formats u64 file size to string with commas and appends "bytes".
fn format_file_size(size: u64) -> String {
    let size_str = size.to_string();
    let mut result = String::new();
    for (i, ch) in size_str.chars().rev().enumerate() {
        if i > 0 && i % 3 == 0 {
            result.insert(0, ',');
        }
        result.insert(0, ch);
    }
    format!("{} bytes", result)
}

/// Retrieves file metadata as a BTreeMap, including size, timestamps, readonly status,
/// and additional attributes (e.g., hidden, temporary, encrypted). Returns any errors.
fn get_file_metadata(file_path: &str) -> Result<BTreeMap<String, String>, std::io::Error> {
    let mut metadata_map = BTreeMap::new();

    // Get the file metadata
    let file_metadata = match get_metadata(file_path) {
        Ok(meta) => {
            let file_size = meta.len();
            let formatted_size = format_file_size(file_size);
            metadata_map.insert("Size".to_string(), formatted_size);
            meta
        }
        Err(e) => {
            let error_message = match e.kind() {
                ErrorKind::PermissionDenied => "Access Denied".to_string(),
                ErrorKind::NotFound => "File Not Found".to_string(),
                _ => format!("Error: {}", e),
            };
            for key in &["Size", "Created", "Modified", "Accessed", "Readonly"] {
                metadata_map.insert((*key).to_string(), error_message.clone());
            }
            return Ok(metadata_map);
        }
    };

    // Helper function to format file times
    fn get_formatted_time(time_result: Result<std::time::SystemTime, std::io::Error>) -> String {
        match time_result {
            Ok(time) => {
                let datetime: DateTime<Utc> = time.into();
                datetime.format("%Y-%m-%d %H:%M:%S").to_string()
            }
            Err(e) => match e.kind() {
                ErrorKind::PermissionDenied => "Access Denied".to_string(),
                ErrorKind::NotFound => "File Not Found".to_string(),
                _ => format!("Error: {}", e),
            },
        }
    }

    // File times
    metadata_map.insert(
        "Accessed".to_string(),
        get_formatted_time(file_metadata.accessed()),
    );
    metadata_map.insert(
        "Created".to_string(),
        get_formatted_time(file_metadata.created()),
    );
    metadata_map.insert(
        "Modified".to_string(),
        get_formatted_time(file_metadata.modified()),
    );

    // Readonly status
    let readonly = file_metadata.permissions().readonly();
    metadata_map.insert("Readonly".to_string(), readonly.to_string());

    // Get file attributes
    match get_file_attributes(file_path) {
        Ok(attributes) => {
            let is_hidden = attributes & FILE_ATTRIBUTE_HIDDEN != 0;
            let is_temporary = attributes & FILE_ATTRIBUTE_TEMPORARY != 0;
            let is_encrypted = attributes & FILE_ATTRIBUTE_ENCRYPTED != 0;
            metadata_map.insert("IsEncrypted".to_string(), is_encrypted.to_string());
            metadata_map.insert("IsHidden".to_string(), is_hidden.to_string());
            metadata_map.insert("IsTemporary".to_string(), is_temporary.to_string());
        }
        Err(err) => {
            for key in &["IsEncrypted", "IsHidden", "IsTemporary"] {
                metadata_map.insert((*key).to_string(), err.clone());
            }
        }
    }

    Ok(metadata_map)
}

/// Formats a file's metadata for a given file change event, converting it into a string.
fn format_event(event: &Event, watcher_dir: &str) -> NotifyResult<String> {
    let event_type = match &event.kind {
        EventKind::Create(_) => "Created",
        EventKind::Modify(_) => "Modified",
        EventKind::Remove(_) => "Removed",
        EventKind::Access(_) => "Accessed",
        _ => "Other",
    };

    let mut event_str = String::new();

    if let Some(path) = event.paths.get(0).map(|p| p.to_str().unwrap_or("")) {
        // Add event type and path
        event_str.push_str(&format!("{}: {}\n", event_type, path));
        
        // Add Watcher information as a separate line
        event_str.push_str(&format!("Watcher: {}\n", watcher_dir));

        // Fetch and append file metadata
        let metadata = get_file_metadata(path);

        match metadata {
            Ok(metadata) => {
                // Format metadata as separate lines
                for (key, value) in metadata.iter() {
                    if key == "Modified" {
                        if NaiveDateTime::parse_from_str(value, "%Y-%m-%d %H:%M:%S").is_err() {
                            let current_time = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
                            event_str.push_str(&format!("{}: {}\n", key, current_time));
                        } else {
                            event_str.push_str(&format!("{}: {}\n", key, value));
                        }
                    } else {
                        event_str.push_str(&format!("{}: {}\n", key, value));
                    }
                }
            }
            Err(e) => {
                println!("Error retrieving metadata for {}: {}", path, e);
                event_str.push_str("Error retrieving metadata\n");
            }
        }
    }

    Ok(event_str.trim_end().to_string())
}

struct MonitoringState {
    watcher: RecommendedWatcher,
    directories: Vec<String>,
}

#[tauri::command]
fn start_monitoring(
    directories: Vec<String>,
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, Arc<Mutex<Option<MonitoringState>>>>,
) -> Result<(), String> {
    println!("Start monitoring of directories: {:?}", directories);

    let (tx, rx) = channel();

    let mut watcher: RecommendedWatcher = Watcher::new(tx.clone(), Config::default())
        .map_err(|e| e.to_string())?;

    // Watch all initial directories
    for dir in &directories {
        watcher.watch(Path::new(dir), RecursiveMode::Recursive)
            .map_err(|e| format!("Failed to watch directory {}: {}", dir, e))?;
    }

    // Clone the Arc to move into the thread
    let state_clone = Arc::clone(&state);

    {
        // Update the shared state
        let mut state_guard = state.lock().map_err(|e| e.to_string())?;
        *state_guard = Some(MonitoringState {
            watcher,
            directories: directories.clone(),
        });
    }

    thread::spawn(move || {
        println!("Monitoring thread started");

        // Use a HashSet to keep track of recent events
        let mut recent_events = HashSet::new();
        let mut event_timestamps = HashMap::new();
        let event_cache_duration = Duration::from_secs(1); // Adjust the duration as needed

        while let Ok(event_result) = rx.recv() {
            // Clean up old events from recent_events
            let now = Instant::now();
            event_timestamps.retain(|_, &mut timestamp| now.duration_since(timestamp) < event_cache_duration);
            recent_events.retain(|event_str| event_timestamps.contains_key(event_str));

            match event_result {
                Ok(event) => {
                    if let Some(path) = event.paths.first() {
                        // Access the latest list of directories from the shared state
                        let directories = {
                            let state_guard = state_clone.lock().unwrap();
                            if let Some(ref monitoring_state) = *state_guard {
                                monitoring_state.directories.clone()
                            } else {
                                Vec::new()
                            }
                        };

                        if let Some(watcher_dir) = directories.iter().find(|dir| path.starts_with(dir)) {
                            if let Ok(event_str) = format_event(&event, watcher_dir) {
                                if !recent_events.contains(&event_str) {
                                    // It's a new event, emit it
                                    println!("File event detected: {}", event_str);
                                    if let Err(e) = app_handle.emit_all("file-change-event", event_str.clone()) {
                                        println!("Failed to emit event: {}", e);
                                    }
                                    // Add to recent_events
                                    recent_events.insert(event_str.clone());
                                    event_timestamps.insert(event_str, now);
                                } else {
                                    // Duplicate event, skip emitting
                                    println!("Duplicate event detected, skipping: {}", event_str);
                                }
                            }
                        }
                    }
                }
                Err(e) => println!("Watch error: {:?}", e),
            }
        }
        println!("Exiting the monitoring thread.");
    });

    Ok(())
}



#[tauri::command]
fn remove_directory(
    directory: String,
    state: tauri::State<'_, Arc<Mutex<Option<MonitoringState>>>>,
) -> Result<(), String> {
    println!("Removing directory: {}", directory);

    let mut state = state.lock().map_err(|e| e.to_string())?;
    
    if let Some(monitoring_state) = state.as_mut() {
        if let Err(e) = monitoring_state.watcher.unwatch(Path::new(&directory)) {
            println!("Failed to unwatch directory {}: {}", directory, e);
            return Err(format!("Failed to unwatch directory {}: {}", directory, e));
        }

        monitoring_state.directories.retain(|dir| dir != &directory);
        println!("Removed directory from monitoring: {}", directory);
        Ok(())
    } else {
        Err("Monitoring has not been started".to_string())
    }
}


#[tauri::command]
fn update_monitoring_directories(
    directories: Vec<String>,
    state: tauri::State<'_, Arc<Mutex<Option<MonitoringState>>>>,
) -> Result<(), String> {
    println!("Updating monitored directories: {:?}", directories);

    let mut state = state.lock().map_err(|e| e.to_string())?;
    
    if let Some(monitoring_state) = state.as_mut() {
        // Stop watching old directories
        for dir in &monitoring_state.directories {
            if let Err(e) = monitoring_state.watcher.unwatch(Path::new(dir)) {
                println!("Failed to unwatch directory {}: {}", dir, e);
            }
        }

        // Start watching new directories
        for dir in &directories {
            if let Err(e) = monitoring_state.watcher.watch(Path::new(dir), RecursiveMode::Recursive) {
                println!("Failed to watch directory {}: {}", dir, e);
            }
        }

        monitoring_state.directories = directories;
        println!("Updated monitored directories");
    } else {
        return Err("Monitoring has not been started".to_string());
    }

    Ok(())
}


#[tauri::command]
fn add_directory(
    directory: String,
    state: tauri::State<'_, Arc<Mutex<Option<MonitoringState>>>>,
) -> Result<(), String> {
    println!("Adding directory: {}", directory);

    let mut state = state.lock().map_err(|e| e.to_string())?;
    
    if let Some(monitoring_state) = state.as_mut() {
        if let Err(e) = monitoring_state.watcher.watch(Path::new(&directory), RecursiveMode::Recursive) {
            println!("Failed to watch directory {}: {}", directory, e);
            return Err(format!("Failed to watch directory {}: {}", directory, e));
        }

        if !monitoring_state.directories.contains(&directory) {
            monitoring_state.directories.push(directory.clone());
        }
        println!("Added directory to monitoring: {}", directory);
        Ok(())
    } else {
        Err("Monitoring has not been started".to_string())
    }
}

#[tauri::command]
fn get_watched_directories(
    state: tauri::State<'_, Arc<Mutex<Option<MonitoringState>>>>,
) -> Result<Vec<String>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    
    if let Some(monitoring_state) = state.as_ref() {
        Ok(monitoring_state.directories.clone())
    } else {
        Err("Monitoring has not been started".to_string())
    }
}

fn main() {
    let monitoring_state = Arc::new(Mutex::new(None::<MonitoringState>));
    
    tauri::Builder::default()
        .manage(monitoring_state)
        .invoke_handler(tauri::generate_handler![
            start_monitoring,
            update_monitoring_directories,
            remove_directory,
            add_directory,
            get_watched_directories  // Add the new command here
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use notify::{EventKind, event::ModifyKind, event::DataChange, event::Event};
}