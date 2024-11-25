use std::collections::HashMap;
use std::ptr::null_mut;
use std::str;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use log::error;
use tauri::Manager;
use winapi::shared::minwindef::TRUE;
use winapi::shared::winerror::ERROR_SUCCESS;
use winapi::um::winnt::{
    REG_NOTIFY_CHANGE_ATTRIBUTES, REG_NOTIFY_CHANGE_LAST_SET, REG_NOTIFY_CHANGE_NAME,
    REG_NOTIFY_CHANGE_SECURITY,
};
use winapi::um::winreg::RegNotifyChangeKeyValue;
use winreg::enums::*;
use winreg::RegKey;

pub struct RegistryMonitor {
    app_handle: tauri::AppHandle,
    monitored_keys: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    running: Arc<AtomicBool>,
}

impl RegistryMonitor {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        println!("Initializing new RegistryMonitor");
        RegistryMonitor {
            app_handle,
            monitored_keys: Arc::new(Mutex::new(HashMap::new())),
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn start_monitoring(&self) -> Result<(), String> {
        if self.running.load(Ordering::SeqCst) {
            return Err("Registry monitoring already started".to_string());
        }
        self.running.store(true, Ordering::SeqCst);
        println!("Registry monitoring started");
        Ok(())
    }

    pub fn stop_monitoring(&self) -> Result<(), String> {
        if !self.running.load(Ordering::SeqCst) {
            return Err("Registry monitoring not started".to_string());
        }
        
        println!("Stopping registry monitoring...");
        self.running.store(false, Ordering::SeqCst);

        let keys = {
            let mut keys = self.monitored_keys.lock().map_err(|e| e.to_string())?;
            let keys = keys.drain().collect::<Vec<_>>();
            keys
        };

        for (key_path, key_running) in keys {
            println!("Stopping monitoring for key: {}", key_path);
            key_running.store(false, Ordering::SeqCst);
        }
        
        println!("Registry monitoring stopped completely");
        Ok(())
    }

    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::SeqCst)
    }

    pub fn add_registry_key(&self, key_path: String) -> Result<(), String> {
        // println!("Attempting to add registry key: {}", key_path);
    
        let h_key = match open_registry_key(&key_path) {
            Ok(key) => key,
            Err(e) => {
                error!("Failed to open registry key '{}': {}", key_path, e);
                return Err(e);
            }
        };
    
        let key_running = Arc::new(AtomicBool::new(true));
    
        {
            let mut keys = self.monitored_keys.lock().map_err(|e| {
                error!("Failed to lock monitored_keys: {}", e);
                e.to_string()
            })?;
            
            if keys.contains_key(&key_path) {
                println!("Key '{}' is already being monitored", key_path);
                return Err("Key is already being monitored".to_string());
            }
            
            keys.insert(key_path.clone(), key_running.clone());
            println!("Added key '{}' to monitored_keys", key_path);
        }
    
        let app_handle = self.app_handle.clone();
        let global_running = self.running.clone();
        let key_path_closure = key_path.clone();
    
        thread::spawn(move || {
            // println!("Started monitoring thread for key '{}'", key_path_closure);
            if let Err(e) = monitor_registry_key(
                h_key,
                &key_path_closure,
                key_running,
                app_handle,
                global_running,
            ) {
                error!("Error monitoring key '{}': {}", key_path_closure, e);
            }
        });
    
        let current_keys = self.get_monitored_keys().unwrap_or_default();
        println!("Current keys:");
        for key in current_keys {
            println!("  - {}", key);
        }
        
        Ok(())
    }

    pub fn remove_registry_key(&self, key_path: String) -> Result<(), String> {
        // println!("Attempting to remove registry key: {}", key_path);
        
        let key_running = {
            let mut keys = self.monitored_keys.lock().map_err(|e| {
                error!("Failed to lock monitored_keys: {}", e);
                e.to_string()
            })?;
            
            if let Some(key_running) = keys.remove(&key_path) {
                println!("Removed key '{}' from monitored_keys", key_path);
                key_running
            } else {
                println!("Key '{}' was not found in monitored_keys", key_path);
                return Err("Key is not being monitored".to_string());
            }
        };

        key_running.store(false, Ordering::SeqCst);
        // println!("Set monitoring to false for key '{}'", key_path);

        let current_keys = self.get_monitored_keys().unwrap_or_default();
        println!("Current monitored keys after removing '{}':", key_path);
        for key in current_keys {
            println!("  - {}", key);
        }

        Ok(())
    }

    pub fn get_monitored_keys(&self) -> Result<Vec<String>, String> {
        let keys = self.monitored_keys.lock().map_err(|e| {
            error!("Failed to lock monitored_keys: {}", e);
            e.to_string()
        })?;
        let key_list = keys.keys().cloned().collect();
        // println!("Retrieved current monitored keys");
        Ok(key_list)
    }
}

fn open_registry_key(key_path: &str) -> Result<RegKey, String> {
    // println!("Attempting to open registry key: {}", key_path);
    if let Some(pos) = key_path.find('\\') {
        let (root_key_str, subkey_path) = key_path.split_at(pos);
        let subkey_path = &subkey_path[1..];
        let root_key = match root_key_str {
            "HKEY_LOCAL_MACHINE" => {
                // println!("Opening HKEY_LOCAL_MACHINE key");
                RegKey::predef(HKEY_LOCAL_MACHINE)
            },
            "HKEY_CURRENT_USER" => {
                // println!("Opening HKEY_CURRENT_USER key");
                RegKey::predef(HKEY_CURRENT_USER)
            },
            "HKEY_CLASSES_ROOT" => {
                // println!("Opening HKEY_CLASSES_ROOT key");
                RegKey::predef(HKEY_CLASSES_ROOT)
            },
            "HKEY_USERS" => {
                // println!("Opening HKEY_USERS key");
                RegKey::predef(HKEY_USERS)
            },
            "HKEY_CURRENT_CONFIG" => {
                // println!("Opening HKEY_CURRENT_CONFIG key");
                RegKey::predef(HKEY_CURRENT_CONFIG)
            },
            _ => {
                error!("Unknown root key: {}", root_key_str);
                return Err(format!("Unknown root key '{}'", root_key_str));
            }
        };

        match root_key.open_subkey(subkey_path) {
            Ok(key) => {
                // println!("Successfully opened registry key: {}", key_path);
                Ok(key)
            },
            Err(e) => {
                error!("Failed to open subkey '{}': {}", subkey_path, e);
                Err(format!("Failed to open registry key '{}': {}", key_path, e))
            }
        }
    } else {
        error!("Invalid registry key path format: {}", key_path);
        Err("Invalid registry key path".to_string())
    }
}


fn clean_registry_data(data: &[u8]) -> String {
    let utf16_bytes: Vec<u16> = data.chunks_exact(2)
        .map(|chunk| u16::from_ne_bytes([chunk[0], chunk[1]]))
        .collect();

    let utf16_string = String::from_utf16_lossy(&utf16_bytes)
        .trim_matches('\0')
        .to_string();

    if utf16_string.trim().is_empty() {
        String::from_utf8_lossy(data)
            .trim_matches('\0')
            .to_string()
    } else {
        utf16_string
    }
}

fn monitor_registry_key(
    h_key: RegKey,
    key_name: &str,
    key_running: Arc<AtomicBool>,
    app_handle: tauri::AppHandle,
    global_running: Arc<AtomicBool>,
) -> Result<(), String> {
    // println!("Starting monitoring thread for registry key '{}'", key_name);

    let mut values_cache: HashMap<String, (Vec<u8>, String)> = HashMap::new();

    // Initial population of values cache
    for value_result in h_key.enum_values() {
        if let Ok((name, value)) = value_result {
            let cleaned_data = clean_registry_data(&value.bytes);
            values_cache.insert(name, (value.bytes, cleaned_data));
        }
    }

    // println!("Initial cache populated for key '{}' with {} values", key_name, values_cache.len());

    while key_running.load(Ordering::SeqCst) && global_running.load(Ordering::SeqCst) {
        unsafe {
            let notify_result = RegNotifyChangeKeyValue(
                h_key.raw_handle(),
                TRUE,
                REG_NOTIFY_CHANGE_NAME | REG_NOTIFY_CHANGE_ATTRIBUTES | REG_NOTIFY_CHANGE_LAST_SET | REG_NOTIFY_CHANGE_SECURITY,
                null_mut(),
                0,
            );

            if notify_result != ERROR_SUCCESS as i32 {
                error!("Failed to set registry notification for '{}'. Error code: {}", key_name, notify_result);
                continue;
            }
        }

        thread::sleep(Duration::from_millis(500));

        if !key_running.load(Ordering::SeqCst) {
            println!("Individual monitoring stopped for key '{}'", key_name);
            break;
        }

        if !global_running.load(Ordering::SeqCst) {
            println!("Global monitoring stopped, ending monitoring for key '{}'", key_name);
            break;
        }

        let current_values: HashMap<String, Vec<u8>> = h_key
            .enum_values()
            .filter_map(|v| v.ok())
            .map(|(name, value)| (name, value.bytes))
            .collect();

        for (name, new_bytes) in &current_values {
            let new_data = clean_registry_data(new_bytes);

            match values_cache.get(name) {
                Some((old_bytes, old_data)) if old_bytes != new_bytes => {
                    let event_str = format!(
                        "UPDATED: Value '{}' in registry key '{}'\nPrevious Data: '{}'\nNew Data: '{}'",
                        name, key_name, old_data, new_data
                    );
                    println!("{}", event_str);
                    if let Err(e) = app_handle.emit_all("registry-change-event", event_str) {
                        error!("Failed to emit registry event: {}", e);
                    }
                }
                None => {
                    let event_str = format!(
                        "ADDED: Value '{}' in registry key '{}'\nNew Data: '{}'",
                        name, key_name, new_data
                    );
                    println!("{}", event_str);
                    if let Err(e) = app_handle.emit_all("registry-change-event", event_str) {
                        error!("Failed to emit registry event: {}", e);
                    }
                }
                _ => {}
            }
            values_cache.insert(name.clone(), (new_bytes.clone(), new_data));
        }

        for (name, (_, old_data)) in values_cache.clone() {
            if !current_values.contains_key(&name) {
                let event_str = format!(
                    "REMOVED: Value '{}' in registry key '{}'\nPrevious Data: '{}'",
                    name, key_name, old_data
                );
                println!("{}", event_str);
                if let Err(e) = app_handle.emit_all("registry-change-event", event_str) {
                    error!("Failed to emit registry event: {}", e);
                }
                values_cache.remove(&name);
            }
        }
    }

    println!("Monitoring thread ended for registry key '{}'", key_name);
    Ok(())
}