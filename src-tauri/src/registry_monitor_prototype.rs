use env_logger;
use log::{error, info};
use std::collections::HashMap;
use std::ptr::null_mut;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use winapi::shared::minwindef::{FALSE, TRUE};
use winapi::um::winnt::{
    REG_NOTIFY_CHANGE_ATTRIBUTES, REG_NOTIFY_CHANGE_LAST_SET, REG_NOTIFY_CHANGE_NAME,
    REG_NOTIFY_CHANGE_SECURITY,
};
use winapi::um::winreg::RegNotifyChangeKeyValue;
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
use winreg::RegKey;

// Function to monitor a specific registry key and log changes (incomplete)
fn monitor_registry_key(
    h_key: RegKey,
    key_name: &str,
    running: Arc<AtomicBool>,
) -> Result<(), String> {
    info!("Monitoring registry key '{}' for changes...", key_name);

    let mut values_cache: HashMap<String, Vec<u8>> = HashMap::new();

    // Initial snapshot of registry values
    for value_result in h_key.enum_values() {
        match value_result {
            Ok((name, value)) => {
                values_cache.insert(name.clone(), value.bytes);
            }
            Err(e) => {
                error!("Failed to enumerate values for '{}': {:?}", key_name, e);
            }
        }
    }

    while running.load(Ordering::SeqCst) {
        // Set up registry key change notification (basic implementation)
        let notify_result = unsafe {
            RegNotifyChangeKeyValue(
                h_key.raw_handle(),
                TRUE, // Watch the entire subtree
                REG_NOTIFY_CHANGE_NAME
                    | REG_NOTIFY_CHANGE_ATTRIBUTES
                    | REG_NOTIFY_CHANGE_LAST_SET
                    | REG_NOTIFY_CHANGE_SECURITY,
                null_mut(),
                FALSE, // Synchronous notification
            )
        };

        if notify_result != 0 {
            error!(
                "Failed to set registry notification for '{}'. Error code: {}",
                key_name, notify_result
            );
            return Err(format!(
                "Failed to set registry notification. Error code: {}",
                notify_result
            ));
        }

        // Placeholder: Detect registry changes (partial)
        info!("Detected a change in '{}'", key_name);

        // Sleep briefly to debounce and allow thread checks
        thread::sleep(Duration::from_millis(500));
    }

    Ok(())
}

// Function to monitor multiple registry keys in separate threads (basic implementation)
fn monitor_selected_keys(running: Arc<AtomicBool>) -> Result<(), String> {
    let startup_hkcu = RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Run")
        .expect("Failed to open HKCU\\Run");

    let startup_hklm = RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run")
        .expect("Failed to open HKLM\\Run");

    let r1 = running.clone();
    let r2 = running.clone();

    // Spawn threads for each registry key to be monitored
    let hkcu_run_thread = thread::spawn(move || {
        monitor_registry_key(startup_hkcu, "HKEY_CURRENT_USER\\Run", r1)
            .expect("Failed to monitor HKCU\\Run");
    });

    let hklm_run_thread = thread::spawn(move || {
        monitor_registry_key(startup_hklm, "HKEY_LOCAL_MACHINE\\Run", r2)
            .expect("Failed to monitor HKLM\\Run");
    });

    hkcu_run_thread.join().unwrap();
    hklm_run_thread.join().unwrap();

    Ok(())
}

// Main function to initialize logger and start monitoring (basic implementation)
fn main() {
    // Initialize the logger with default settings
    env_logger::Builder::from_default_env()
        .filter(None, log::LevelFilter::Info)
        .init();

    // Shared running flag to control threads
    let running = Arc::new(AtomicBool::new(true));
    let r = running.clone();

    // Start monitoring (incomplete)
    match monitor_selected_keys(running) {
        Ok(_) => info!("Monitoring stopped."),
        Err(e) => error!("Error: {}", e),
    }
}
