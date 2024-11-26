use serde::{Serialize, Deserialize};
use sysinfo::{System, SystemExt, ProcessExt};

#[derive(Serialize)]
pub struct KillProcessResponse {
    success: bool,
    message: String,
}

#[derive(Deserialize)]
pub struct ProcessInfo {
    pid: u32,
    name: String,
}

pub async fn handle_kill_process(process_info: ProcessInfo) -> Result<KillProcessResponse, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    // Check if PID exists and matches process name
    if let Some(process) = sys.process(sysinfo::Pid::from(process_info.pid as usize)) {
        if process.name() == process_info.name {
            // Handle direct PID match case (taskkill and direct kill attempts)
            #[cfg(target_os = "windows")]
            {
                // ... taskkill code stays the same ...
            }

            match process.kill() {
                true => Ok(KillProcessResponse {
                    success: true,
                    message: "Success!".to_string()
                }),
                false => Ok(KillProcessResponse {
                    success: false,
                    message: "Failed (Insufficient permissions)".to_string()
                })
            }
        } else {
            // PID exists but name doesn't match - search by name
            try_kill_by_name(&sys, &process_info.name)
        }
    } else {
        // PID doesn't exist - search by name
        try_kill_by_name(&sys, &process_info.name)
    }
}

// Helper function for searching and killing by name
fn try_kill_by_name(sys: &System, name: &str) -> Result<KillProcessResponse, String> {
    let matching_processes: Vec<_> = sys.processes().values()
        .filter(|p| p.name() == name)
        .collect();

    match matching_processes.len() {
        0 => Ok(KillProcessResponse {
            success: false,
            message: "Failed (Process not found)".to_string()
        }),
        1 => {
            let process = matching_processes[0];
            match process.kill() {
                true => Ok(KillProcessResponse {
                    success: true,
                    message: "Success! (PID Changed)".to_string()
                }),
                false => Ok(KillProcessResponse {
                    success: false,
                    message: "Failed (Insufficient permissions)".to_string()
                })
            }
        },
        _ => Ok(KillProcessResponse {
            success: false,
            message: format!("Failed (PID Changed, multiple {}s found)", name)
        })
    }
}