// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Vite boilerplate code commented out for now
// // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

// fn main() {
//     tauri::Builder::default()
//         .invoke_handler(tauri::generate_handler![greet])
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }

// v1 file mod watcher, currently terminal-only w/ output to .txt file:
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Result, Watcher}; // File watching +notifications
use std::io::Write;
use std::path::Path;
use std::sync::mpsc::channel; // For channels
use std::time::Duration;
use std::{fs, io, thread}; // For file ops, I/O, and threading

fn main() -> Result<()> {
    // Ask the user for the number of directories to monitor (all subdirectories are monitored as well)
    println!("Input the number of directories that you would like to monitor:");
    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .expect("Failed to read line");
    let num_dirs: usize = input.trim().parse().expect("Please enter a valid number");

    // Get the paths of the directories to monitor
    let mut directories = Vec::new();
    for i in 0..num_dirs {
        println!("Directory {}:", i + 1);
        input.clear();
        io::stdin()
            .read_line(&mut input)
            .expect("Failed to read line");
        let dir = input.trim().to_string();
        directories.push(dir);
    }

    // Create a channel used by the watcher to transmit notifications received by event handling thread
    let (tx, rx) = channel();

    // Create a watcher object
    let mut watcher: RecommendedWatcher = Watcher::new(tx, Config::default())?;

    // Add directories to the watcher
    for dir in &directories {
        watcher.watch(Path::new(dir), RecursiveMode::Recursive)?;
    }

    // Create a .txt file to log changes
    let output_file = "file_changes.txt";
    let output_file_path = Path::new(output_file);
    let mut file = fs::File::create(output_file).expect("Unable to create file");

    // Start a new thread to handle events
    thread::spawn(move || loop {
        match rx.recv() {
            Ok(event_result) => match event_result {
                Ok(event) => {
                     // Filter out events on the log .txt file itself so it doesn't get spammed recursively
                    if event.paths.iter().any(|path| path == output_file_path) {
                        continue;
                    }
                    // Print to terminal + write it to the .txt file
                    if let Ok(event_str) = format_event(&event) {
                        println!("{}", event_str);
                        writeln!(file, "{}", event_str).expect("Unable to write to file");
                    }
                }
                Err(e) => println!("watch error: {:?}", e),
            },
            Err(e) => println!("channel error: {:?}", e),
        }
    });

    // Keep the main thread running
    println!("Monitoring directories: {:?}", directories);
    loop {
        thread::sleep(Duration::from_secs(1));
    }
}

// Function to format event into a string
fn format_event(event: &Event) -> Result<String> {
    let mut event_str = format!("{:?}: ", event.kind);
    if let Some(paths) = event
        .paths
        .iter()
        .map(|p| p.to_string_lossy().into_owned())
        .next()
    {
        event_str.push_str(&paths);
    }
    Ok(event_str)
}
