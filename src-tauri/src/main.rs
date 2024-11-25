mod fsfilter_rs;
mod file_monitor;
mod registry_monitor;
use file_monitor::FileMonitor;
use registry_monitor::RegistryMonitor;
mod kill_process;
mod wmi_manager;

use std::sync::{Arc, Mutex};
use tauri::Manager;
use std::process::Command;
use std::env;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;

use tauri::command;



const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Application state containing both monitoring systems.
struct AppState {
    file_monitor: Arc<FileMonitor>,
    registry_monitor: Arc<Mutex<Option<RegistryMonitor>>>,
}

// File Monitoring Commands

#[tauri::command]
async fn start_monitoring(
    directories: Vec<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.file_monitor.start_monitoring(directories)
}

#[tauri::command]
async fn remove_directory(
    directory: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.file_monitor.remove_directory(directory)
}

#[tauri::command]
async fn update_monitoring_directories(
    directories: Vec<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.file_monitor.update_monitoring_directories(directories)
}

#[tauri::command]
async fn add_directory(
    directory: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.file_monitor.add_directory(directory)
}

#[tauri::command]
async fn get_watched_directories(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    state.file_monitor.get_watched_directories()
}

// Registry Monitoring Commands

#[tauri::command]
async fn start_registry_monitoring(
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let registry_guard = state.registry_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(monitor) = registry_guard.as_ref() {
        monitor.start_monitoring()
    } else {
        Err("Registry monitor not initialized".to_string())
    }
}

#[tauri::command]
async fn stop_registry_monitoring(
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let registry_guard = state.registry_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(monitor) = registry_guard.as_ref() {
        monitor.stop_monitoring()
    } else {
        Err("Registry monitor not initialized".to_string())
    }
}

#[tauri::command]
async fn is_registry_monitoring(
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    let registry_guard = state.registry_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(monitor) = registry_guard.as_ref() {
        Ok(monitor.is_running())
    } else {
        Ok(false)
    }
}

#[tauri::command]
async fn add_registry_key_to_monitor(
    key_path: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let registry_guard = state.registry_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(monitor) = registry_guard.as_ref() {
        monitor.add_registry_key(key_path)
    } else {
        Err("Registry monitoring not started".to_string())
    }
}

#[tauri::command]
async fn remove_registry_key_from_monitor(
    key_path: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let registry_guard = state.registry_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(monitor) = registry_guard.as_ref() {
        monitor.remove_registry_key(key_path)
    } else {
        Err("Registry monitoring not started".to_string())
    }
}

#[tauri::command]
async fn get_monitored_registry_keys(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    let registry_guard = state.registry_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(monitor) = registry_guard.as_ref() {
        monitor.get_monitored_keys()
    } else {
        Err("Registry monitoring not started".to_string())
    }
}

#[tauri::command]
fn open_registry_editor(path: Option<String>) -> Result<(), String> {
    match path {
        Some(reg_path) => {
            // First set the LastKey in registry using powershell
            let set_key_command = format!(
                "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Applets\\Regedit' -Name 'LastKey' -Value '{}'",
                reg_path
            );

            Command::new("powershell")
                .creation_flags(CREATE_NO_WINDOW)
                .args(["-Command", &set_key_command])
                .output()
                .map_err(|e| format!("Failed to set registry key: {}", e))?;

            // Then launch regedit
            Command::new("cmd.exe")
                .creation_flags(CREATE_NO_WINDOW)
                .args(["/c", "start", "regedit.exe"])
                .spawn()
                .map_err(|e| format!("Failed to open Registry Editor: {}", e))?;

            Ok(())
        },
        None => {
            // Just open regedit without setting a path
            Command::new("cmd.exe")
                .creation_flags(CREATE_NO_WINDOW)
                .args(["/c", "start", "regedit.exe"])
                .spawn()
                .map_err(|e| format!("Failed to open Registry Editor: {}", e))?;
            
            Ok(())
        }
    }
}

#[tauri::command]
async fn open_file_explorer(path: Option<String>) -> Result<(), String> {
    let path = match path {
        Some(p) => PathBuf::from(p),
        None => dirs::home_dir().ok_or("Could not find home directory")?
    };

    if !path.exists() {
        return Err("Path does not exist".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args([path.to_string_lossy().to_string()])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}


#[command]
fn show_properties(file_path: &str) -> Result<String, String> {
    use windows::{
        core::BSTR,
        Win32::{
            System::Com::{
                CLSCTX_INPROC_SERVER, CoCreateInstance, CoInitializeEx, CoUninitialize,
                COINIT_APARTMENTTHREADED, VARIANT, VT_BSTR
            },
            UI::Shell::{Folder, IShellDispatch, Shell},
        },
    };
    use std::mem::ManuallyDrop;
    
    fn variant_from_str(s: &str) -> VARIANT {
        let bstr = BSTR::from(s);
        let mut variant: VARIANT = VARIANT::default();
        
        unsafe {
            // Use ptr::write to avoid running destructors
            std::ptr::write(&mut (*variant.Anonymous.Anonymous).vt, VT_BSTR);
            
            // Write the BSTR value
            std::ptr::write(
                &mut (*variant.Anonymous.Anonymous).Anonymous.bstrVal,
                ManuallyDrop::new(bstr)
            );
        }
        
        variant
    }
 // Initialize COM library
 unsafe {
    CoInitializeEx(Some(std::ptr::null_mut()), COINIT_APARTMENTTHREADED)
        .map_err(|e| format!("Failed to initialize COM library: {}", e))?;
}

// Ensure COM is uninitialized when we're done
let _com_guard = scopeguard::guard((), |_| unsafe {
    CoUninitialize();
});

// Validate if the file exists
if !std::path::Path::new(file_path).exists() {
    return Err(format!("File does not exist: {}", file_path));
}

// Extract folder path and file name
let path = std::path::Path::new(file_path);
let folder_path = match path.parent() {
    Some(p) => p.to_str().unwrap_or_default(),
    None => {
        return Err(format!(
            "Unable to get parent folder of the file: {}",
            file_path
        ));
    }
};

let file_name = match path.file_name() {
    Some(f) => f.to_str().unwrap_or_default(),
    None => {
        return Err(format!(
            "Unable to get file name from the path: {}",
            file_path
        ));
    }
};

// Create an instance of Shell.Application as IShellDispatch
let shell_dispatch: IShellDispatch = unsafe {
    CoCreateInstance(
        &Shell,
        None,
        CLSCTX_INPROC_SERVER,
    )
    .map_err(|e| e.to_string())?
};

    // Create VARIANT from folder_path
    let folder_path_variant = variant_from_str(folder_path);

    // Get the folder
    let folder: Folder = unsafe { shell_dispatch.NameSpace(folder_path_variant) }
        .map_err(|e| format!("Unable to access the folder '{}': {}", folder_path, e))?;

    // Create BSTR from file_name
    let file_name_bstr: BSTR = BSTR::from(file_name);

    // Get the item
    let item = unsafe { folder.ParseName(&file_name_bstr) }
        .map_err(|e| format!("Unable to find the file '{}' in '{}': {}", file_name, folder_path, e))?;

    // Create VARIANT from "Properties"
    let properties_variant = variant_from_str("Properties");

    // Invoke the "Properties" verb on the item
    match unsafe { item.InvokeVerb(properties_variant) } {
        Ok(_) => Ok(format!(
            "Successfully opened properties dialog for '{}'",
            file_path
        )),
        Err(e) => Err(format!("Failed to invoke 'Properties' verb: {}", e)),
    }
}


#[tauri::command]
async fn kill_process(process_info: kill_process::ProcessInfo) -> Result<kill_process::KillProcessResponse, String> {
    kill_process::handle_kill_process(process_info).await
}

fn main() {
    
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

            // Start registry monitoring
            monitor.start_monitoring()?;

            // Optionally add default keys to monitor
            // monitor.add_registry_key("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run".to_string())?;
            // monitor.add_registry_key("HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services".to_string())?;

            let app_state = AppState {
                file_monitor: Arc::new(FileMonitor::new(app_handle.clone())),
                registry_monitor: Arc::new(Mutex::new(Some(monitor))),
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
            kill_process,
            // Registry monitoring commands
            start_registry_monitoring,
            stop_registry_monitoring,
            is_registry_monitoring,
            add_registry_key_to_monitor,
            remove_registry_key_from_monitor,
            get_monitored_registry_keys,
            open_registry_editor,
            open_file_explorer,
            show_properties
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
