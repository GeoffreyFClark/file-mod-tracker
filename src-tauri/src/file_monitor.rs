use std::collections::BTreeMap;
use serde::Serialize;
use std::ffi::OsStr;
use std::fs::metadata as get_metadata;
use std::io::ErrorKind;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::sync::mpsc::channel;
use std::thread;
use std::time::Duration;
use chrono::{DateTime, Utc, SecondsFormat};
use tauri::Manager;
use winapi::um::fileapi::GetFileAttributesW;
use std::char::decode_utf16;
use std::time::SystemTime;
use wchar::wchar_t;
use winapi::um::winnt::{
    FILE_ATTRIBUTE_ENCRYPTED, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_TEMPORARY,
};

use crate::wmi_manager;
use wmi_manager::initialize_wmi;

// Import driver communication modules
use crate::fsfilter_rs::driver_comm;
use crate::fsfilter_rs::shared_def::{CDriverMsgs, IOMessage};

#[derive(Serialize)]
struct FileEventMetadata {
    size: String,
    created: String,
    modified: String,
    accessed: String,
    readonly: String,
    is_encrypted: String,
    is_hidden: String,
    is_temporary: String,
}

#[derive(Serialize)]
struct FileEvent {
    path: String,
    pid: String,
    event_type: String,
    timestamp: String,
    metadata: FileEventMetadata,
    watcher: String,
    size: String,
    irp_operation: String,
    entropy: f64,
    extension: String,
    gid: String,
    process_name: String,
    process_path: String,
}

pub struct MonitoringState {
    driver: Arc<driver_comm::Driver>,
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

        if let Err(e) = initialize_wmi() {
            println!("Failed to initialize WMI connection: {}", e);
        
        } else {
            println!("WMI manager initialized successfully.");
        }

        println!("Start monitoring of directories: {:?}", directories);


        // Open communication with the driver
        let driver = driver_comm::Driver::open_kernel_driver_com()
            .map_err(|_| "Failed to open driver communication. Is the minifilter started?".to_string())?;

        driver.driver_set_app_pid()
            .map_err(|_| "Failed to set driver app pid".to_string())?;

        // Wrap the driver in an Arc
        let driver = Arc::new(driver);

        // Save the driver and directories in the state
        {
            let mut state_guard = self.state.lock().map_err(|e| e.to_string())?;
            *state_guard = Some(MonitoringState {
                driver: Arc::clone(&driver),
                directories: directories.clone(),
            });
        }

        let state_clone_for_thread = Arc::clone(&self.state);
        let app_handle_clone = self.app_handle.clone();

        // Create a channel to communicate between threads
        let (tx_iomsgs, rx_iomsgs) = channel::<IOMessage>();

        // Thread to retrieve events from the driver
        thread::spawn(move || {
            let mut vecnew: Vec<u8> = Vec::with_capacity(65536);

            loop {
                let driver_clone = {
                    let state_guard = state_clone_for_thread.lock().unwrap();
                    if let Some(ref monitoring_state) = *state_guard {
                        Arc::clone(&monitoring_state.driver)
                    } else {
                        break;
                    }
                };

                if let Some(reply_irp) = driver_clone.get_irp(&mut vecnew) {
                    if reply_irp.num_ops > 0 {
                        for drivermsg in CDriverMsgs::new(&reply_irp) {
                            let mut iomsg = IOMessage::from(&drivermsg);
                            iomsg.exepath();  // Call exepath() here right after creating the IOMessage
                            if tx_iomsgs.send(iomsg).is_err() {
                                println!("Error sending IOMessage");
                            }
                        }
                    } else {
                        thread::sleep(Duration::from_millis(2));
                    }
                } else {
                    println!("Failed to receive driver message");
                    break;
                }
            }
            println!("Exiting the event retrieval thread.");
        });

        // Thread to process events and emit them
        let state_clone_for_processing = Arc::clone(&self.state);
        let app_handle_clone = app_handle_clone.clone();

        thread::spawn(move || {
            while let Ok(io_message) = rx_iomsgs.recv() {
 
                if (io_message.file_change == 1 && io_message.irp_op == 4)
                    || (io_message.file_change == 0 && io_message.irp_op == 4)
                    || (io_message.file_change == 0 && io_message.irp_op == 3)
                {
                    continue; // Stop here and continue with next IOMessage
                }

                // Handle "Renamed" events with file_change == 4
                if io_message.file_change == 4 {
                    // Split file paths using | delimiter
                    if let Some(pipe_index) = io_message.filepathstr.find('|') {
                        let first_path_str = io_message.filepathstr[..pipe_index].to_string();
                        let second_path_str = io_message.filepathstr[pipe_index + 1..].to_string();

                        let first_path = Path::new(&first_path_str);
                        let second_path = Path::new(&second_path_str);

                        let first_dir = first_path.parent();
                        let second_dir = second_path.parent();

                        let is_same_directory = match (first_dir, second_dir) {
                            (Some(dir1), Some(dir2)) => dir1 == dir2,
                            _ => false,
                        };

                        // Get metadata using the new file path/name
                        match get_file_metadata(&second_path_str) {
                            Ok(metadata) => {
                                let directories = {
                                    let state_guard = state_clone_for_processing.lock().unwrap();
                                    if let Some(ref monitoring_state) = *state_guard {
                                        monitoring_state.directories.clone()
                                    } else {
                                        Vec::new()
                                    }
                                };
                    
                                // First try to find a watcher for the source path
                                let mut watcher_dir_option = directories.iter().find(|dir| {
                                    let dir_path = Path::new(dir);
                                    first_path.starts_with(dir_path)
                                });
                    
                                // If no watcher found for source path, check destination path
                                if watcher_dir_option.is_none() {
                                    watcher_dir_option = directories.iter().find(|dir| {
                                        let dir_path = Path::new(dir);
                                        second_path.starts_with(dir_path)
                                    });
                                }
                    
                                if let Some(watcher_dir) = watcher_dir_option {
                                    println!("Original rename/move event file size: {}", io_message.file_size);
                                    // Prepare new IOMessages
                                    let mut io_message_from = io_message.clone();
                                    let mut io_message_to = io_message.clone();
                    
                                    let original_file_size = io_message.file_size;
                                    io_message_from.file_size = original_file_size;
                                    io_message_to.file_size = original_file_size;
                    
                                    if is_same_directory {
                                        // It's a rename
                                        io_message_from.file_change = 6; // "Renamed From"
                                        io_message_from.filepathstr = first_path_str.clone();
                    
                                        io_message_to.file_change = 5; // "Renamed To"
                                        io_message_to.filepathstr = second_path_str.clone();
                                    } else {
                                        // It's a move
                                        io_message_from.file_change = 13; // "Moved From"
                                        io_message_from.filepathstr = first_path_str.clone();
                    
                                        io_message_to.file_change = 12; // "Moved To"
                                        io_message_to.filepathstr = second_path_str.clone();
                                    }
                    
                                    let event_kind_str_from = file_change_to_string(io_message_from.file_change);
                                    let event_kind_str_to = file_change_to_string(io_message_to.file_change);
                    
                                    // Format and emit both events using the same watcher
                                    let event_str_from = format_event_from_metadata_with_watcher(
                                        event_kind_str_from,
                                        &io_message_from.filepathstr,
                                        &metadata,
                                        watcher_dir,
                                        &io_message_from,
                                    );
                    
                                    if let Some(event_str_from) = event_str_from {
                                        println!("File event detected: {}", event_str_from);
                                        if let Err(e) = app_handle_clone.emit_all("file-change-event", event_str_from.clone()) {
                                            println!("Failed to emit event: {}", e);
                                        }
                                    }
                    
                                    let event_str_to = format_event_from_metadata_with_watcher(
                                        event_kind_str_to,
                                        &io_message_to.filepathstr,
                                        &metadata,
                                        watcher_dir,
                                        &io_message_to,
                                    );
                    
                                    if let Some(event_str_to) = event_str_to {
                                        println!("File event detected: {}", event_str_to);
                                        if let Err(e) = app_handle_clone.emit_all("file-change-event", event_str_to.clone()) {
                                            println!("Failed to emit event: {}", e);
                                        }
                                    }
                                } else {
                                    continue;
                                }
                            }
                            Err(e) => {
                                println!("Error retrieving metadata for {}: {}", second_path_str, e);
                            }
                        }
                        
                        // Continue to the next message after handling
                        continue;
                    } else {
                        println!("Error: Renamed event with no '|' in filepathstr");
                        continue;
                    }
                }

                // Handle other event types normally
                let filepath = Path::new(&io_message.filepathstr);

                // Access the directories from the state
                let directories = {
                    let state_guard = state_clone_for_processing.lock().unwrap();
                    if let Some(ref monitoring_state) = *state_guard {
                        monitoring_state.directories.clone()
                    } else {
                        Vec::new()
                    }
                };

                if let Some(watcher_dir) = directories.iter().find(|dir| {
                    let dir_path = Path::new(dir);
                    filepath.starts_with(dir_path)
                }) {
                    let path_str = io_message.filepathstr.clone();
                    let event_kind_str = file_change_to_string(io_message.file_change);

                    // Retrieve metadata
                    match get_file_metadata(&path_str) {
                        Ok(metadata) => {
                            if let Some(event_str) = format_event_from_metadata_with_watcher(
                                event_kind_str,
                                &path_str,
                                &metadata,
                                watcher_dir,
                                &io_message,
                            ) {
                                println!("File event detected: {}", event_str);
                                if let Err(e) = app_handle_clone.emit_all(
                                    "file-change-event",
                                    event_str.clone(),
                                ) {
                                    println!("Failed to emit event: {}", e);
                                }
                            }
                        }
                        Err(e) => {
                            println!("Error retrieving metadata for {}: {}", path_str, e);
                        }
                    }
                }
            }
            println!("Exiting the processing thread.");
        });

        Ok(())
    }


    pub fn remove_directory(&self, directory: String) -> Result<(), String> {
        println!("Removing directory: {}", directory);

        let mut state = self.state.lock().map_err(|e| e.to_string())?;

        if let Some(monitoring_state) = state.as_mut() {
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
            if !monitoring_state.directories.contains(&directory) {
                monitoring_state.directories.push(directory.clone());
                println!("Added directory to monitoring: {}", directory);
                Ok(())
            } else {
                println!("Directory is already being monitored: {}", directory);
                Ok(())
            }
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

fn file_change_to_string(file_change: u8) -> &'static str {
    match file_change {
        0 => "Unchanged",
        1 => "Opened",
        2 => "Write",
        3 => "Created",
        4 => "Renamed",
        5 => "Renamed To",
        6 => "Renamed From",
        7 => "Extension Changed",
        8 => "Deleted",
        9 => "DeleteNewFile",
        10 => "Overwrite",
        11 => "Moved",
        12 => "Moved To",
        13 => "Moved From",
        _ => "Unknown",
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

    fn get_formatted_time(time_result: Result<SystemTime, std::io::Error>) -> String {
        match time_result {
            Ok(time) => {
                let datetime: DateTime<Utc> = time.into();
                datetime.to_rfc3339_opts(SecondsFormat::Millis, true)
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


pub fn get_process_name_and_path(io_message: &IOMessage) -> Result<(String, String), String> {
    // Try QueryFullProcessImageNameA first via runtime_features
    if !io_message.runtime_features.exepath.as_os_str().is_empty() {
        let process_path = io_message.runtime_features.exepath.to_string_lossy().into_owned();
        let process_name = io_message.runtime_features.exepath
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_else(|| "Unknown".to_string());
            
        Ok((process_name, process_path))
    } else {
        // Fall back to WMI if QueryFullProcessImageNameA failed
        wmi_manager::query_process_info(io_message.pid)
    }
}

fn format_event_from_metadata_with_watcher(
    event_type: &str,
    path: &str,
    metadata: &BTreeMap<String, String>,
    watcher_dir: &str,
    io_message: &IOMessage,
) -> Option<String> {  // Changed return type to Option<String>
    // Get process name early to check if we should skip this event
    let process_name = match get_process_name_and_path(io_message) {
        Ok((name, _)) => name,
        Err(_) => "Unknown".to_string(),
    };

    // Skip event if process is SearchProtocolHost
    if process_name == "SearchProtocolHost.exe" {
        return None;
    }

    let timestamp = if event_type == "Moved To" || event_type == "Renamed To" {
        let mut datetime: DateTime<Utc> = io_message.time.into();
        datetime += chrono::Duration::milliseconds(1);
        datetime.to_rfc3339_opts(SecondsFormat::Millis, true)
    } else {
        format_system_time(io_message.time)
    };

    let file_event = FileEvent {
        path: path.to_string(),
        pid: io_message.pid.to_string(),
        event_type: event_type.to_string(),
        timestamp,
        metadata: FileEventMetadata {
            size: metadata.get("Size").unwrap_or(&"N/A".to_string()).clone(),
            created: metadata.get("Created").unwrap_or(&"N/A".to_string()).clone(),
            modified: metadata.get("Modified").unwrap_or(&"N/A".to_string()).clone(),
            accessed: metadata.get("Accessed").unwrap_or(&"N/A".to_string()).clone(),
            readonly: metadata.get("Readonly").unwrap_or(&"false".to_string()).clone(),
            is_encrypted: metadata.get("IsEncrypted").unwrap_or(&"false".to_string()).clone(),
            is_hidden: metadata.get("IsHidden").unwrap_or(&"false".to_string()).clone(),
            is_temporary: metadata.get("IsTemporary").unwrap_or(&"false".to_string()).clone(),
        },
        watcher: watcher_dir.to_string(),
        size: format_file_size_i64(io_message.file_size),
        irp_operation: irp_op_to_string(io_message.irp_op).to_string(),
        entropy: io_message.entropy,
        extension: wchar_array_to_string(&io_message.extension),
        gid: io_message.gid.to_string(),
        process_name,
        process_path: match get_process_name_and_path(io_message) {
            Ok((_, path)) => path,
            Err(_) => "".to_string(),
        },
    };

    Some(serde_json::to_string(&file_event).unwrap_or_else(|_| "{}".to_string()))
}



fn format_system_time(system_time: SystemTime) -> String {
    let datetime: DateTime<Utc> = system_time.into();
    datetime.to_rfc3339_opts(SecondsFormat::Millis, true)
}


fn irp_op_to_string(irp_op: u8) -> &'static str {
    match irp_op {
        0 => "NONE",
        1 => "READ",
        2 => "WRITE",
        3 => "SETINFO",
        4 => "CREATE",
        5 => "CLEANUP",
        _ => "UNKNOWN",
    }
}

fn format_file_size_i64(size: i64) -> String {
    if size >= 0 {
        format_file_size(size as u64)
    } else {
        "Unknown size".to_string()
    }
}

fn wchar_array_to_string(wchar_array: &[wchar_t]) -> String {
    let utf16_vec: Vec<u16> = wchar_array.iter().take_while(|&&c| c != 0).map(|&c| c as u16).collect();
    decode_utf16(utf16_vec.iter().cloned())
        .map(|r| r.unwrap_or('\u{FFFD}'))
        .collect()
}