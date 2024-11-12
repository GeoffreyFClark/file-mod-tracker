#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::collections::HashMap;
use std::ffi::OsStr;
use std::fs::metadata as get_metadata;
use std::fs::OpenOptions;
use std::io::ErrorKind;
use std::io::Write;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;
use std::sync::mpsc::channel;
use std::thread;
use std::time::Duration;

use chrono::{DateTime, Utc};
use tauri::Manager;
mod fsfilter_rs;
use fsfilter_rs::driver_comm;
use fsfilter_rs::shared_def::{CDriverMsgs, IOMessage};
use winapi::um::fileapi::GetFileAttributesW;
use winapi::um::winnt::{
    FILE_ATTRIBUTE_ENCRYPTED, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_TEMPORARY,
};

/// Converts the `file_change` code to a human-readable string.
fn file_change_to_string(file_change: u8) -> &'static str {
    match file_change {
        0 => "NotSet",
        1 => "OpenDirectory",
        2 => "Write",
        3 => "NewFile",
        4 => "RenameFile",
        5 => "ExtensionChanged",
        6 => "DeleteFile",
        7 => "DeleteNewFile",
        8 => "OverwriteFile",
        _ => "Unknown",
    }
}

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

/// function to log messages to `debug_output.txt`
fn log_to_file(message: &str) {
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("debug_output.txt")
        .expect("Cannot open or create debug_output.txt");

    if let Err(e) = writeln!(file, "{}", message) {
        eprintln!("Couldn't write to file: {}", e);
    }

    if let Err(e) = file.flush() {
        eprintln!("Couldn't flush file: {}", e);
    }
}

/// Retrieves file metadata along with process ID as a HashMap
fn get_file_metadata_with_pid(
    file_path: &str,
    pid: u32,
) -> Result<HashMap<String, String>, std::io::Error> {
    let mut metadata_map = get_file_metadata(file_path)?;
    // Add the PID to metadata
    metadata_map.insert("PID".to_string(), pid.to_string());
    Ok(metadata_map)
}

/// Tauri command that starts monitoring file system events using the minifilter driver.
#[tauri::command]
fn start_monitoring(
    directories: Vec<String>,
    exclude_not_set: bool,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    log_to_file(&format!(
        "Starting file monitoring for directories: {:?}, Exclude NotSet: {}",
        directories, exclude_not_set
    ));
    let driver = driver_comm::Driver::open_kernel_driver_com().map_err(|_| {
        "Failed to open driver communication. Is the minifilter started?".to_string()
    })?;
    driver
        .driver_set_app_pid()
        .map_err(|_| "Failed to set driver app pid".to_string())?;

    let mut vecnew: Vec<u8> = Vec::with_capacity(65536);
    let (tx_iomsgs, rx_iomsgs) = channel::<IOMessage>();

    // Thread to retrieve file events from the minifilter driver
    thread::spawn(move || loop {
        if let Some(reply_irp) = driver.get_irp(&mut vecnew) {
            if reply_irp.num_ops > 0 {
                for drivermsg in CDriverMsgs::new(&reply_irp) {
                    let iomsg = IOMessage::from(&drivermsg);
                    if tx_iomsgs.send(iomsg).is_err() {
                        log_to_file("Error sending IOMessage");
                    }
                }
            } else {
                thread::sleep(Duration::from_millis(2));
            }
        } else {
            log_to_file("Failed to receive driver message");
            break;
        }
    });

    let app_handle_clone = app_handle.clone();
    let directories_clone = directories.clone();

    // Thread to handle received `IOMessage`s and emit events to the frontend
    thread::spawn(move || {
        while let Ok(io_message) = rx_iomsgs.recv() {
            let filepath = Path::new(&io_message.filepathstr);

            // Filter events based on the monitored directories
            if directories_clone.iter().any(|dir| {
                let dir_path = Path::new(dir);
                filepath.starts_with(dir_path)
            }) {
                let path_str = io_message.filepathstr.clone();
                let event_kind_str = file_change_to_string(io_message.file_change);

                // Exclude "NotSet" events if the exclude_not_set option is true
                if exclude_not_set && event_kind_str == "NotSet" {
                    continue;
                }

                match get_file_metadata_with_pid(&path_str, io_message.pid) {
                    Ok(metadata) => {
                        let metadata_str = metadata
                            .iter()
                            .map(|(key, value)| format!("{}: {}", key, value))
                            .collect::<Vec<String>>()
                            .join(", ");
                        let event_str =
                            format!("{}: {}\n{}", event_kind_str, path_str, metadata_str);


                        log_to_file(&event_str);

                        if app_handle_clone
                            .emit_all("file-change-event", event_str)
                            .is_err()
                        {
                            log_to_file("Failed to emit event to frontend");
                        }
                    }
                    Err(e) => {
                        log_to_file(&format!(
                            "Error retrieving metadata for {}: {}",
                            path_str, e
                        ));
                    }
                }
            }
        }
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
mod tests;
