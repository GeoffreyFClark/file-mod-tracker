mod file_monitor;
mod registry_monitor;

use file_monitor::FileMonitor;
use log::{error, info};
use registry_monitor::RegistryMonitor;
use std::sync::{Arc, Mutex};
use tauri::Manager;

/// Application state containing both monitoring systems.
/// 
/// The state is shared across threads and command handlers using Arc (Atomic Reference Counting)
/// for thread-safe sharing and Mutex for safe mutable access.
///
/// # Fields
/// * `file_monitor` - Thread-safe reference to the file system monitor
/// * `registry_monitor` - Thread-safe reference to the optional registry monitor
struct AppState {
    file_monitor: Arc<FileMonitor>,
    registry_monitor: Arc<Mutex<Option<RegistryMonitor>>>,
}

// File Monitoring Commands

/// Initiates file system monitoring for specified directories.
///
/// # Arguments
/// * `directories` - Vector of directory paths to monitor
/// * `state` - Application state containing the file monitor
///
/// # Returns
/// * `Ok(())` if monitoring started successfully
/// * `Err(String)` with error message if monitoring failed to start
#[tauri::command]
async fn start_monitoring(
    directories: Vec<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.file_monitor.start_monitoring(directories)
}

/// Removes a directory from the monitoring list.
///
/// # Arguments
/// * `directory` - Path of directory to stop monitoring
/// * `state` - Application state containing the file monitor
///
/// # Returns
/// * `Ok(())` if directory was removed successfully
/// * `Err(String)` with error message if removal failed
#[tauri::command]
async fn remove_directory(
    directory: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.file_monitor.remove_directory(directory)
}

/// Updates the list of monitored directories.
///
/// # Arguments
/// * `directories` - New vector of directory paths to monitor
/// * `state` - Application state containing the file monitor
///
/// # Returns
/// * `Ok(())` if update was successful
/// * `Err(String)` with error message if update failed
#[tauri::command]
async fn update_monitoring_directories(
    directories: Vec<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.file_monitor.update_monitoring_directories(directories)
}

/// Adds a new directory to the monitoring list.
///
/// # Arguments
/// * `directory` - Path of directory to start monitoring
/// * `state` - Application state containing the file monitor
///
/// # Returns
/// * `Ok(())` if directory was added successfully
/// * `Err(String)` with error message if addition failed
#[tauri::command]
async fn add_directory(
    directory: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.file_monitor.add_directory(directory)
}

/// Retrieves the list of currently monitored directories.
///
/// # Arguments
/// * `state` - Application state containing the file monitor
///
/// # Returns
/// * `Ok(Vec<String>)` containing list of monitored directory paths
/// * `Err(String)` with error message if retrieval failed
#[tauri::command]
async fn get_watched_directories(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    state.file_monitor.get_watched_directories()
}

// Registry Monitoring Commands

/// Initiates registry monitoring for predefined registry keys.
///
/// Creates and starts a new registry monitor if one isn't already running.
/// Monitors specific registry keys related to startup, services, and software installation.
///
/// # Arguments
/// * `state` - Application state containing the registry monitor
/// * `app_handle` - Handle to the Tauri application for event emission
///
/// # Returns
/// * `Ok(())` if monitoring started successfully
/// * `Err(String)` if monitoring was already running or failed to start
#[tauri::command]
async fn start_registry_monitoring(
    state: tauri::State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut registry_guard = state.registry_monitor.lock().map_err(|e| e.to_string())?;
    if registry_guard.is_none() {
        let monitor = RegistryMonitor::new(app_handle);
        monitor.start_monitoring()?;
        *registry_guard = Some(monitor);
        Ok(())
    } else {
        Err("Registry monitoring already started".to_string())
    }
}

/// Stops the registry monitoring system.
///
/// # Arguments
/// * `state` - Application state containing the registry monitor
///
/// # Returns
/// * `Ok(())` if monitoring was successfully stopped
/// * `Err(String)` if monitoring wasn't running or failed to stop
#[tauri::command]
async fn stop_registry_monitoring(
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut registry_guard = state.registry_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(monitor) = registry_guard.as_ref() {
        monitor.stop_monitoring()?;
        *registry_guard = None;
        Ok(())
    } else {
        Err("Registry monitoring not started".to_string())
    }
}

/// Checks if registry monitoring is currently active.
///
/// # Arguments
/// * `state` - Application state containing the registry monitor
///
/// # Returns
/// * `Ok(bool)` - true if monitoring is active, false otherwise
/// * `Err(String)` if the check failed
#[tauri::command]
async fn is_registry_monitoring(
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    let registry_guard = state.registry_monitor.lock().map_err(|e| e.to_string())?;
    Ok(registry_guard.is_some())
}

/// Main application entry point.
///
/// Sets up logging, initializes the application state, and starts the Tauri application.
/// Configures the monitoring systems and registers command handlers for frontend interaction.
///
/// # Logging
/// - Configures timestamp-based logging
/// - Differentiates between registry and file system logs
/// - Logs are formatted as: [timestamp] level - system: message
///
/// # Command Registration
/// - Registers file monitoring commands
/// - Registers registry monitoring commands
/// - Makes commands available to the frontend via Tauri's IPC system
fn main() {
    println!("Hello, world!");
    // Configure logging system
    env_logger::Builder::from_env(env_logger::Env::default())
        .format(|buf, record| {
            use std::io::Write;
            let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
            writeln!(
                buf,
                "[{}] {} - {}: {}",
                timestamp,
                record.level(),
                if record.target().contains("registry") { "Registry" } else { "FileSystem" },
                record.args()
            )
        })
        .init();

    // Initialize and run the Tauri application
    tauri::Builder::default()
            .setup(|app| {
                let app_handle = app.handle();
                let monitor = RegistryMonitor::new(app_handle.clone());
                
                // Start registry monitoring immediately
                if let Err(e) = monitor.start_monitoring() {
                    error!("Failed to start registry monitoring: {}", e);
                } else {
                    info!("Registry monitoring started automatically for default locations");
                }
            
                let app_state = AppState {
                    file_monitor: Arc::new(FileMonitor::new(app_handle.clone())),
                    registry_monitor: Arc::new(Mutex::new(Some(monitor))), // Store the already-started monitor
                };
                app.manage(app_state);
                Ok(())
            })
        .invoke_handler(tauri::generate_handler![
            // File monitoring commands
            start_monitoring,
            update_monitoring_directories,
            remove_directory,
            add_directory,
            get_watched_directories,
            // Registry monitoring commands
            start_registry_monitoring,
            stop_registry_monitoring,
            is_registry_monitoring
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}