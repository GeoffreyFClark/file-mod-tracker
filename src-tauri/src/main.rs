use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Result as NotifyResult, Watcher};
use std::path::Path;
use std::sync::mpsc::{channel, RecvError};
use std::thread;
use tauri::Manager;

#[tauri::command]  // This attribute exposes the function to the Tauri runtime to allow it to be called from the front-end
fn start_monitoring(directories: Vec<String>, app_handle: tauri::AppHandle) -> Result<(), String> {
    println!(
        "Start monitoring of directories: {:?}",
        directories
    );

    // Create a channel used by the watcher to transmit notifications received by event handling thread
    let (tx, rx) = channel();

    // Initialize the watcher object
    let mut watcher: RecommendedWatcher = match Watcher::new(tx, Config::default()) {
        Ok(watcher) => {
            println!("Watcher created successfully");
            watcher
        }
        Err(e) => {
            println!("Failed to create watcher: {}", e);
            return Err(e.to_string());
        }
    };

    // Spawn a thread to handle events
    thread::spawn(move || {
        // Add directories to the watcher inside the thread to avoid blocking the main thread
        for dir in directories {
            println!("Attempting to watch directory: {}", dir);
            if let Err(e) = watcher.watch(Path::new(&dir), RecursiveMode::Recursive) { 
                println!("Failed to watch directory {}: {}", dir, e);
                return;
            } else {
                println!("Successfully watching directory: {}", dir);
            }
        }

        println!("Monitoring thread started");
        loop {
            match rx.recv() {
                Ok(event_result) => match event_result {
                    Ok(event) => {
                        if let Ok(event_str) = format_event(&event) {
                            println!("File event detected: {}", event_str);
                            if let Err(e) = app_handle.emit_all("file-change-event", event_str) {
                                println!("Failed to emit event: {}", e);
                            }
                        } else {
                            println!("Failed to format event");
                        }
                    }
                    Err(e) => println!("Watch error: {:?}", e),
                },
                Err(e) => {
                    println!("channel error: {:?}", e);
                    break;
                }
            }
        }
        println!("Exiting the monitoring thread.");
    });

    Ok(())
}

// Function to format event into a string
fn format_event(event: &Event) -> NotifyResult<String> {
    // println!("Formatting event: {:?}", event.kind);
    let mut event_str = format!("{:?}: ", event.kind);
    if let Some(paths) = event
        .paths
        .iter()
        .map(|p| p.to_string_lossy().into_owned())
        .next()
    {
        event_str.push_str(&paths);
    }
    // println!("Formatted event: {}", event_str);
    Ok(event_str)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_monitoring])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
