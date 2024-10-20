use env_logger;
use log::{error, info};
use std::collections::HashMap;
use std::ptr::null_mut;
use std::str;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use winapi::shared::minwindef::TRUE;
use winapi::shared::winerror::ERROR_SUCCESS;
use winapi::um::winnt::{
    REG_NOTIFY_CHANGE_ATTRIBUTES, REG_NOTIFY_CHANGE_LAST_SET, REG_NOTIFY_CHANGE_NAME,
    REG_NOTIFY_CHANGE_SECURITY,
};
use winapi::um::winreg::RegNotifyChangeKeyValue;
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
use winreg::RegKey;

// Function to monitor a specific registry key and log changes
fn monitor_registry_key(
    h_key: RegKey,
    key_name: &str,
    running: Arc<AtomicBool>,
) -> Result<(), String> {
    info!("Monitoring registry key '{}' for any changes.", key_name);

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
        // Set up registry key change notification
        let notify_result = unsafe {
            RegNotifyChangeKeyValue(
                h_key.raw_handle(),
                TRUE, // Watch the entire subtree
                REG_NOTIFY_CHANGE_NAME
                    | REG_NOTIFY_CHANGE_ATTRIBUTES
                    | REG_NOTIFY_CHANGE_LAST_SET
                    | REG_NOTIFY_CHANGE_SECURITY,
                null_mut(),
                0, // Asynchronous notification 
            )
        };

        if notify_result != ERROR_SUCCESS as i32 {
            error!(
                "Failed to set registry notification for '{}'. Error code: {}",
                key_name, notify_result
            );
            return Err(format!(
                "Failed to set registry notification for '{}'. Error code: {}",
                key_name, notify_result
            ));
        }

        // Sleep briefly to debounce and allow thread checks
        thread::sleep(Duration::from_millis(500));

        // Break the loop if `running` is set to false
        if !running.load(Ordering::SeqCst) {
            info!("Stopping registry monitoring for '{}'.", key_name);
            break;
        }

        // Detect changes
        for value_result in h_key.enum_values() {
            match value_result {
                Ok((name, value)) => {
                    let new_data = value.bytes.clone();
                    if let Some(old_data) = values_cache.get(&name) {
                        if &new_data != old_data {
                            // Convert data to readable strings, or display bytes if not valid UTF-8
                            let old_data_str = match str::from_utf8(old_data) {
                                Ok(v) => v.to_string(),
                                Err(_) => format!("{:?}", old_data),
                            };
                            let new_data_str = match str::from_utf8(&new_data) {
                                Ok(v) => v.to_string(),
                                Err(_) => format!("{:?}", &new_data),
                            };
                            info!(
                                "UPDATED: Value '{}' in registry key '{}' was changed. Previous Data: '{}' -> New Data: '{}'",
                                key_name, name, old_data_str, new_data_str
                            );
                            // Update cache with the new data
                            values_cache.insert(name.clone(), new_data.clone());
                        }
                    } else {
                        // Log new registry values that are added
                        let new_data_str = match str::from_utf8(&new_data) {
                            Ok(v) => v.to_string(),
                            Err(_) => format!("{:?}", &new_data),
                        };
                        info!(
                            "ADDED: Value '{}' was added to registry key '{}'. Data: '{}'",
                            key_name, name, new_data_str
                        );
                        values_cache.insert(name.clone(), new_data.clone());
                    }
                }
                Err(e) => {
                    error!("Error enumerating values in '{}': {:?}", key_name, e);
                }
            }
        }

        // Check for deleted values
        let current_names: Vec<String> = h_key
            .enum_values()
            .filter_map(|v| v.ok().map(|(name, _)| name))
            .collect();

        let cached_names: Vec<String> = values_cache.keys().cloned().collect();
        for name in cached_names {
            if !current_names.contains(&name) {
                // Get the deleted data before removing it from the cache
                if let Some(deleted_data) = values_cache.get(&name) {
                    let data_str = match str::from_utf8(deleted_data) {
                        Ok(v) => v.to_string(),
                        Err(_) => format!("{:?}", deleted_data),
                    };
                    info!(
                        "REMOVED: Value '{}' was deleted from registry key '{}'. Previous Data: '{}'",
                        name, key_name, data_str
                    );
                }
                values_cache.remove(&name);
            }
        }
    }

    Ok(())
}

// Function to monitor multiple registry keys in separate threads
fn monitor_selected_keys(running: Arc<AtomicBool>) -> Result<(), String> {
    let startup_hklm = RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run")
        .expect(
            "Failed to open HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        );
    let startup_hkcu = RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Run")
        .expect(
            "Failed to open HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        );
    let services_hklm = RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey("SYSTEM\\CurrentControlSet\\Services")
        .expect("Failed to open HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services");
    let uninstall_hklm = RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall")
        .expect("Failed to open HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall");

    let r1 = running.clone();
    let r2 = running.clone();
    let r3 = running.clone();
    let r4 = running.clone();

    let hklm_run_thread = thread::spawn(move || {
        monitor_registry_key(startup_hklm, "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", r1)
            .expect("Failed to monitor HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run");
    });

    let hkcu_run_thread = thread::spawn(move || {
        monitor_registry_key(startup_hkcu, "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", r2)
            .expect("Failed to monitor HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run");
    });

    let services_thread = thread::spawn(move || {
        monitor_registry_key(
            services_hklm,
            "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services",
            r3,
        )
        .expect("Failed to monitor HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services");
    });

    let uninstall_thread = thread::spawn(move || {
        monitor_registry_key(uninstall_hklm, "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall", r4)
            .expect("Failed to monitor HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall");
    });

    hklm_run_thread.join().unwrap();
    hkcu_run_thread.join().unwrap();
    services_thread.join().unwrap();
    uninstall_thread.join().unwrap();

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

    // Start monitoring (incomplete)
    match monitor_selected_keys(running) {
        Ok(_) => info!("Monitoring stopped."),
        Err(e) => error!("Error: {}", e),
    }
}
