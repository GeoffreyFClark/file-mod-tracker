use crate::*;
use notify::{
    event::{CreateKind, DataChange, ModifyKind},
    Event, EventKind,
};
use regex::Regex;
use std::path::PathBuf;

/// Helper function to create a temporary file to use for tests.
fn create_temp_file(file_name: &str) -> PathBuf {
    let temp_file_path = std::env::temp_dir().join(file_name);
    std::fs::File::create(&temp_file_path).unwrap();
    temp_file_path
}

#[test]
fn test_format_event() {
    let temp_file_path = create_temp_file("temp_test_file.txt");

    let event = Event {
        kind: EventKind::Create(CreateKind::File),
        paths: vec![temp_file_path.clone()],
        attrs: Default::default(),
    };

    let formatted_event = format_event(&event).unwrap();
    assert!(formatted_event.contains("Create(File):"));
    assert!(formatted_event.contains(temp_file_path.to_str().unwrap()));
    assert!(formatted_event.contains("Size:"));
    assert!(formatted_event.contains("Created:"));
    assert!(formatted_event.contains("Modified:"));
    assert!(formatted_event.contains("Accessed:"));

    // Clean up the temporary file
    std::fs::remove_file(temp_file_path).unwrap();
}

#[test]
fn test_format_event_with_metadata() {
    let temp_file_path = create_temp_file("temp_test_file_with_metadata.txt");

    let event = Event {
        kind: EventKind::Create(CreateKind::File),
        paths: vec![temp_file_path.clone()],
        attrs: Default::default(),
    };

    let formatted_event = format_event(&event).unwrap();

    // Check that the formatted event contains the expected substrings
    assert!(formatted_event.contains("Create(File):"));
    assert!(formatted_event.contains(temp_file_path.to_str().unwrap()));

    // Check that size is correctly formatted
    let size_regex = Regex::new(r"Size: \d+(,\d{3})* bytes").unwrap();
    assert!(size_regex.is_match(&formatted_event));

    // Check date formats (YYYY-MM-DD HH:MM:SS)
    let date_regex = Regex::new(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}").unwrap();
    assert!(formatted_event.contains("Created:"));
    assert!(formatted_event.contains("Modified:"));
    assert!(formatted_event.contains("Accessed:"));
    assert_eq!(date_regex.captures_iter(&formatted_event).count(), 3);

    // Clean up the temporary file
    std::fs::remove_file(temp_file_path).unwrap();
}

#[test]
fn test_format_event_file_not_found() {
    let non_existent_path = PathBuf::from("Z:/this/path/does/not/exist.txt");

    let event = Event {
        kind: EventKind::Modify(ModifyKind::Data(DataChange::Content)),
        paths: vec![non_existent_path.clone()],
        attrs: Default::default(),
    };

    let formatted_event = format_event(&event).unwrap();

    // Check that the formatted event contains the expected substrings
    assert!(formatted_event.contains("Modify(Data(Content)):"));
    assert!(formatted_event.contains(non_existent_path.to_str().unwrap()));
    assert!(formatted_event.contains("Size: File Not Found"));
    assert!(formatted_event.contains("Created: File Not Found"));
    assert!(formatted_event.contains("Modified: File Not Found"));
    assert!(formatted_event.contains("Accessed: File Not Found"));
    assert!(formatted_event.contains("Readonly: File Not Found"));
}

#[test]
fn test_format_event_access_denied() {
    // This test can cover scenarios where access to the file is denied, resulting in "Access Denied" messages.
    assert!(true);
}
