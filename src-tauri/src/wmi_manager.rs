use serde::Deserialize;
use std::error::Error;
use std::sync::mpsc::{self, Sender, Receiver};
use std::thread;
use once_cell::sync::OnceCell;
use wmi::{COMLibrary, WMIConnection};

// The field names need to match the WMI property names exactly
#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct Win32Process {
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "ExecutablePath")]
    executable_path: Option<String>,
    #[serde(rename = "ProcessId")]
    process_id: u32,
}

pub enum WmiRequest {
    GetProcessInfo {
        pid: u32,
        responder: Sender<Result<(String, String), String>>,
    },
}

pub static WMI_REQUEST_SENDER: OnceCell<Sender<WmiRequest>> = OnceCell::new();

pub fn initialize_wmi() -> Result<(), Box<dyn Error>> {
    let (request_sender, request_receiver): (Sender<WmiRequest>, Receiver<WmiRequest>) = mpsc::channel();

    WMI_REQUEST_SENDER
        .set(request_sender.clone())
        .map_err(|_| "WMI Request Sender already initialized")?;

    thread::spawn(move || {
        let com_con = match COMLibrary::without_security() {
            Ok(con) => {
                println!("COM library initialized successfully without security.");
                con
            },
            Err(e) => {
                eprintln!("Failed to initialize COM library without security: {}", e);
                return;
            }
        };

        let wmi_con = match WMIConnection::new(com_con.into()) {
            Ok(conn) => {
                println!("WMI connection established successfully.");
                conn
            },
            Err(e) => {
                eprintln!("Failed to establish WMI connection: {}", e);
                return;
            }
        };

        for request in request_receiver {
            match request {
                WmiRequest::GetProcessInfo { pid, responder } => {
                    
                    // Add logging for the actual WMI query
                    let query = format!(
                        "SELECT Name, ExecutablePath, ProcessId FROM Win32_Process WHERE ProcessId = {}",
                        pid
                    );

                    let results: Result<Vec<Win32Process>, _> = wmi_con.raw_query(&query);

                    match results {
                        Ok(processes) => {
                            if let Some(process) = processes.first() {
                                let name = process.name.clone();
                                let path = process.executable_path.clone()
                                    .unwrap_or_else(|| "Path not available".to_string());
                                let _ = responder.send(Ok((name, path)));
                            } else {
                                let error_msg = format!("Process with PID {} not found.", pid);
                                println!("{}", error_msg);
                                let _ = responder.send(Err(error_msg));
                            }
                        }
                        Err(e) => {
                            let error_msg = format!("WMI query failed: {}", e);
                            println!("{}", error_msg);
                            let _ = responder.send(Err(error_msg));
                        }
                    }
                }
            }
        }

        println!("WMI thread has terminated.");
    });

    Ok(())
}

pub fn query_process_info(pid: u32) -> Result<(String, String), String> {
    let sender = WMI_REQUEST_SENDER
        .get()
        .ok_or("WMI Request Sender not initialized. Call initialize_wmi() first.")?;

    let (responder_tx, responder_rx) = mpsc::channel();

    sender
        .send(WmiRequest::GetProcessInfo { pid, responder: responder_tx })
        .map_err(|e| format!("Failed to send WMI request: {}", e))?;

    responder_rx
        .recv()
        .map_err(|e| format!("Failed to receive WMI response: {}", e))?
}