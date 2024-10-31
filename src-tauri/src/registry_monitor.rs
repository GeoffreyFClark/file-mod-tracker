use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::ptr::null_mut;
use std::str;
use std::thread;
use std::time::Duration;
use log::error;
use winapi::shared::minwindef::TRUE;
use winapi::shared::winerror::ERROR_SUCCESS;
use winapi::um::winnt::{
    REG_NOTIFY_CHANGE_ATTRIBUTES, REG_NOTIFY_CHANGE_LAST_SET, REG_NOTIFY_CHANGE_NAME,
    REG_NOTIFY_CHANGE_SECURITY,
};
use winapi::um::winreg::RegNotifyChangeKeyValue;
use winreg::enums::HKEY_LOCAL_MACHINE;
use winreg::RegKey;
use tauri::Manager;

pub struct RegistryMonitorState {
    running: Arc<AtomicBool>,
}

pub struct RegistryMonitor {
    state: Arc<Mutex<Option<RegistryMonitorState>>>,
    app_handle: tauri::AppHandle,
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

impl RegistryMonitor {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        RegistryMonitor {
            state: Arc::new(Mutex::new(None)),
            app_handle,
        }
    }

    pub fn start_monitoring(&self) -> Result<(), String> {
        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        if state.is_some() {
            return Err("Registry monitoring already started".to_string());
        }

        let running = Arc::new(AtomicBool::new(true));
        *state = Some(RegistryMonitorState {
            running: running.clone(),
        });
        
        self.monitor_registry_keys(running)?;
        
        Ok(())
    }

    pub fn stop_monitoring(&self) -> Result<(), String> {
        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        if let Some(monitoring_state) = state.as_ref() {
            monitoring_state.running.store(false, Ordering::SeqCst);
            *state = None;
            Ok(())
        } else {
            Err("Registry monitoring not started".to_string())
        }
    }

    fn monitor_registry_keys(
        &self,
        running: Arc<AtomicBool>,
    ) -> Result<(), String> {
        let startup_hklm = RegKey::predef(HKEY_LOCAL_MACHINE)
            .open_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run")
            .map_err(|e| format!("Failed to open HKLM Run key: {}", e))?;

        let services_hklm = RegKey::predef(HKEY_LOCAL_MACHINE)
            .open_subkey("SYSTEM\\CurrentControlSet\\Services")
            .map_err(|e| format!("Failed to open Services key: {}", e))?;

        let r1 = running.clone();
        let r2 = running.clone();

        let app_handle1 = self.app_handle.clone();
        let app_handle2 = self.app_handle.clone();

        thread::spawn(move || {
            if let Err(e) = monitor_registry_key(
                startup_hklm,
                "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
                r1,
                app_handle1,
            ) {
                error!("HKLM Run monitoring error: {}", e);
            }
        });

        thread::spawn(move || {
            if let Err(e) = monitor_registry_key(
                services_hklm,
                "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services",
                r2,
                app_handle2,
            ) {
                error!("Services monitoring error: {}", e);
            }
        });

        Ok(())
    }
}

fn monitor_registry_key(
    h_key: RegKey,
    key_name: &str,
    running: Arc<AtomicBool>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    println!("Monitoring registry key '{}' for any changes.", key_name);

    let mut values_cache: HashMap<String, (Vec<u8>, String)> = HashMap::new();

    for value_result in h_key.enum_values() {
        if let Ok((name, value)) = value_result {
            let cleaned_data = clean_registry_data(&value.bytes);
            values_cache.insert(name, (value.bytes, cleaned_data));
        }
    }

    while running.load(Ordering::SeqCst) {
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

        if !running.load(Ordering::SeqCst) {
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

    Ok(())
}