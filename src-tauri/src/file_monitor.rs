use std::collections::{HashMap, HashSet, BTreeMap};
use std::ffi::OsStr;
use std::fs::metadata as get_metadata;
use std::io::ErrorKind;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::sync::mpsc::channel;
use std::thread;
use std::time::{Duration, Instant};
use chrono::{DateTime, Utc, NaiveDateTime};
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Result as NotifyResult, Watcher};
use tauri::Manager;
use winapi::um::fileapi::GetFileAttributesW;
use winapi::um::winnt::{
    FILE_ATTRIBUTE_ENCRYPTED, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_TEMPORARY,
};

pub struct MonitoringState {
    watcher: RecommendedWatcher,
    directories: Vec<String>,
}

pub struct FileMonitor {
    state: Arc<Mutex<Option<MonitoringState>>>,
    app_handle: tauri::AppHandle,
}

impl FileMonitor {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        FileMonitor {
            state: Arc::new(Mutex::new(None)),
            app_handle,
        }
    }

    pub fn start_monitoring(&self, directories: Vec<String>) -> Result<(), String> {
        println!("Start monitoring of directories: {:?}", directories);

        let (tx, rx) = channel();

        let mut watcher: RecommendedWatcher = Watcher::new(tx.clone(), Config::default())
            .map_err(|e| e.to_string())?;

        for dir in &directories {
            watcher.watch(Path::new(dir), RecursiveMode::Recursive)
                .map_err(|e| format!("Failed to watch directory {}: {}", dir, e))?;
        }

        let state_clone = Arc::clone(&self.state);
        {
            let mut state_guard = self.state.lock().map_err(|e| e.to_string())?;
            *state_guard = Some(MonitoringState {
                watcher,
                directories: directories.clone(),
            });
        }

        let app_handle = self.app_handle.clone();

        thread::spawn(move || {
            println!("Monitoring thread started");

            let mut recent_events = HashSet::new();
            let mut event_timestamps = HashMap::new();
            let event_cache_duration = Duration::from_secs(1);

            while let Ok(event_result) = rx.recv() {
                let now = Instant::now();
                event_timestamps.retain(|_, &mut timestamp| now.duration_since(timestamp) < event_cache_duration);
                recent_events.retain(|event_str| event_timestamps.contains_key(event_str));

                match event_result {
                    Ok(event) => {
                        if let Some(path) = event.paths.first() {
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
                                        println!("File event detected: {}", event_str);
                                        if let Err(e) = app_handle.emit_all("file-change-event", event_str.clone()) {
                                            println!("Failed to emit event: {}", e);
                                        }
                                        recent_events.insert(event_str.clone());
                                        event_timestamps.insert(event_str, now);
                                    } else {
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

    pub fn remove_directory(&self, directory: String) -> Result<(), String> {
        println!("Removing directory: {}", directory);

        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        
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

    pub fn update_monitoring_directories(&self, directories: Vec<String>) -> Result<(), String> {
        println!("Updating monitored directories: {:?}", directories);

        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        
        if let Some(monitoring_state) = state.as_mut() {
            for dir in &monitoring_state.directories {
                if let Err(e) = monitoring_state.watcher.unwatch(Path::new(dir)) {
                    println!("Failed to unwatch directory {}: {}", dir, e);
                }
            }

            for dir in &directories {
                if let Err(e) = monitoring_state.watcher.watch(Path::new(dir), RecursiveMode::Recursive) {
                    println!("Failed to watch directory {}: {}", dir, e);
                }
            }

            monitoring_state.directories = directories;
            println!("Updated monitored directories");
            Ok(())
        } else {
            Err("Monitoring has not been started".to_string())
        }
    }

    pub fn add_directory(&self, directory: String) -> Result<(), String> {
        println!("Adding directory: {}", directory);

        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        
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

    pub fn get_watched_directories(&self) -> Result<Vec<String>, String> {
        let state = self.state.lock().map_err(|e| e.to_string())?;
        
        if let Some(monitoring_state) = state.as_ref() {
            Ok(monitoring_state.directories.clone())
        } else {
            Err("Monitoring has not been started".to_string())
        }
    }
}

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

fn get_file_metadata(file_path: &str) -> Result<BTreeMap<String, String>, std::io::Error> {
    let mut metadata_map = BTreeMap::new();

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

    let readonly = file_metadata.permissions().readonly();
    metadata_map.insert("Readonly".to_string(), readonly.to_string());

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
        event_str.push_str(&format!("{}: {}\n", event_type, path));
        event_str.push_str(&format!("Watcher: {}\n", watcher_dir));

        let metadata = get_file_metadata(path);

        match metadata {
            Ok(metadata) => {
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

