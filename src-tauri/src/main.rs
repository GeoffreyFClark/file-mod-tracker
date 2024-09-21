#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::collections::HashMap;
use std::ffi::OsStr;
use std::fs::metadata as get_metadata;
use std::io::ErrorKind;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;
use std::sync::mpsc::channel;
use std::thread;

use chrono::{DateTime, Utc};
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Result as NotifyResult, Watcher};
use tauri::Manager;
use winapi::um::fileapi::GetFileAttributesW;
use winapi::um::winnt::{
    FILE_ATTRIBUTE_ENCRYPTED, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_TEMPORARY,
};

/// Retrieves file attributes for a given path using `GetFileAttributesW` from winapi,
/// converting the path to UTF-16. Returns the attribute bitmask (`u32`) or an error message.
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

/// Retrieves file metadata as a HashMap, including size, timestamps, readonly status,
/// and additional attributes (e.g., hidden, temporary, encrypted). Returns any errors.
fn get_file_metadata(file_path: &str) -> Result<HashMap<String, String>, std::io::Error> {
    let mut metadata_map = HashMap::new();

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
        "Created".to_string(),
        get_formatted_time(file_metadata.created()),
    );
    metadata_map.insert(
        "Modified".to_string(),
        get_formatted_time(file_metadata.modified()),
    );
    metadata_map.insert(
        "Accessed".to_string(),
        get_formatted_time(file_metadata.accessed()),
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
            metadata_map.insert("IsHidden".to_string(), is_hidden.to_string());
            metadata_map.insert("IsTemporary".to_string(), is_temporary.to_string());
            metadata_map.insert("IsEncrypted".to_string(), is_encrypted.to_string());
        }
        Err(err) => {
            for key in &["IsHidden", "IsTemporary", "IsEncrypted"] {
                metadata_map.insert((*key).to_string(), err.clone());
            }
        }
    }

    Ok(metadata_map)
}

/// Formats a file's metadata for a given file change event, converting it into a string.
fn format_event(event: &Event) -> NotifyResult<String> {
    let mut event_str = format!("{:?}", event.kind);

    if let Some(path) = event.paths.get(0) {
        let path_str = path.to_string_lossy().into_owned();
        event_str.push_str(&format!(": {}", path_str));

        // Fetch and append file metadata
        match get_file_metadata(&path_str) {
            Ok(metadata) => {
                let metadata_str = metadata
                    .iter()
                    .map(|(key, value)| format!("{}: {}", key, value))
                    .collect::<Vec<String>>()
                    .join(", ");
                event_str.push_str(&format!("\n{}", metadata_str));
            }
            Err(e) => {
                println!("Error retrieving metadata for {}: {}", path_str, e);
            }
        }
    }
    Ok(event_str)
}

/// Tauri command that starts monitoring specified directories for file system changes,
/// emitting events to the frontend. Runs in a separate thread.
#[tauri::command]
fn start_monitoring(directories: Vec<String>, app_handle: tauri::AppHandle) -> Result<(), String> {
    println!("Start monitoring of directories: {:?}", directories);

    let (tx, rx) = channel();

    let mut watcher: RecommendedWatcher =
        Watcher::new(tx, Config::default()).map_err(|e| e.to_string())?;

    thread::spawn(move || {
        for dir in directories {
            if let Err(e) = watcher.watch(Path::new(&dir), RecursiveMode::Recursive) {
                println!("Failed to watch directory {}: {}", dir, e);
                return;
            }
        }

        println!("Monitoring thread started");
        while let Ok(event_result) = rx.recv() {
            match event_result {
                Ok(event) => {
                    if let Ok(event_str) = format_event(&event) {
                        println!("File event detected: {}", event_str);
                        if let Err(e) = app_handle.emit_all("file-change-event", event_str) {
                            println!("Failed to emit event: {}", e);
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_monitoring])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}


#[cfg(test)]
mod tests {
    use super::*;
    use notify::{EventKind, event::ModifyKind, event::DataChange, event::Event};

    #[test]
    fn test_format_event() {
        let event = Event {
            kind: EventKind::Modify(ModifyKind::Data(DataChange::Content)),
            paths: vec![Path::new("/test/path").to_path_buf()],
            attrs: Default::default(),
        };

        let formatted_event = format_event(&event).unwrap();
        assert_eq!(formatted_event, "Error retrieving metadata for /test/path: File Not Found");
    }
}