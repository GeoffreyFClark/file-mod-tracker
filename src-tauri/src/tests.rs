use crate::*;
use std::ffi::OsStr;
use std::fs::{self, OpenOptions};
use std::io::Read;
use std::os::windows::ffi::OsStrExt;
use std::path::PathBuf;
use winapi::um::winnt::{
    FILE_ATTRIBUTE_ENCRYPTED, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_TEMPORARY,
};

/// Helper function to create a temporary file to use for tests.
fn create_temp_file(file_name: &str) -> PathBuf {
    let temp_file_path = std::env::temp_dir().join(file_name);
    std::fs::File::create(&temp_file_path).unwrap();
    temp_file_path
}

/// Test for file_change_to_string function
#[test]
fn test_file_change_to_string() {
    assert_eq!(file_change_to_string(0), "NotSet");
    assert_eq!(file_change_to_string(1), "OpenDirectory");
    assert_eq!(file_change_to_string(2), "Write");
    assert_eq!(file_change_to_string(3), "NewFile");
    assert_eq!(file_change_to_string(4), "RenameFile");
    assert_eq!(file_change_to_string(5), "ExtensionChanged");
    assert_eq!(file_change_to_string(6), "DeleteFile");
    assert_eq!(file_change_to_string(7), "DeleteNewFile");
    assert_eq!(file_change_to_string(8), "OverwriteFile");
    assert_eq!(file_change_to_string(255), "Unknown");
}

/// Test for get_file_attributes function
#[test]
fn test_get_file_attributes() {
    let temp_file_path = create_temp_file("test_get_file_attributes.txt");
    let path_str = temp_file_path.to_str().unwrap();
    let attributes_result = get_file_attributes(path_str);
    assert!(attributes_result.is_ok());
    let attributes = attributes_result.unwrap();
    // Since we just created the file, it shouldn't have special attributes
    assert_eq!(attributes & FILE_ATTRIBUTE_HIDDEN, 0);
    assert_eq!(attributes & FILE_ATTRIBUTE_TEMPORARY, 0);
    assert_eq!(attributes & FILE_ATTRIBUTE_ENCRYPTED, 0);

    // Clean up
    fs::remove_file(temp_file_path).unwrap();
}

/// Test for format_file_size function
#[test]
fn test_format_file_size() {
    assert_eq!(format_file_size(0), "0 bytes");
    assert_eq!(format_file_size(1), "1 bytes");
    assert_eq!(format_file_size(999), "999 bytes");
    assert_eq!(format_file_size(1000), "1,000 bytes");
    assert_eq!(format_file_size(1234567), "1,234,567 bytes");
}

/// Test for get_file_metadata function
#[test]
fn test_get_file_metadata() {
    let temp_file_path = create_temp_file("test_get_file_metadata.txt");
    let path_str = temp_file_path.to_str().unwrap();

    let metadata_result = get_file_metadata(path_str);
    assert!(metadata_result.is_ok());
    let metadata = metadata_result.unwrap();

    // Check that the expected keys are present
    let expected_keys = vec![
        "Size",
        "Created",
        "Modified",
        "Accessed",
        "Readonly",
        "IsHidden",
        "IsTemporary",
        "IsEncrypted",
    ];
    for key in expected_keys {
        assert!(
            metadata.contains_key(key),
            "Metadata should contain key {}",
            key
        );
    }

    // Clean up
    fs::remove_file(temp_file_path).unwrap();
}

/// Test for log_to_file function
#[test]
fn test_log_to_file() {
    let test_message = "This is a test log message.";
    log_to_file(test_message);

    // Read the log file and check if the message was written
    let mut file = OpenOptions::new()
        .read(true)
        .open("debug_output.txt")
        .expect("Cannot open debug_output.txt");

    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    assert!(contents.contains(test_message));
}

/// Test for get_file_attributes with a hidden file
#[test]
fn test_get_file_attributes_hidden_file() {
    let temp_file_path = create_temp_file("test_hidden_file.txt");
    let path_str = temp_file_path.to_str().unwrap();

    // Set the file as hidden
    use winapi::um::fileapi::SetFileAttributesW;
    let path_wide: Vec<u16> = OsStr::new(path_str)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    unsafe {
        SetFileAttributesW(path_wide.as_ptr(), FILE_ATTRIBUTE_HIDDEN);
    }

    let attributes_result = get_file_attributes(path_str);
    assert!(attributes_result.is_ok());
    let attributes = attributes_result.unwrap();
    assert_ne!(attributes & FILE_ATTRIBUTE_HIDDEN, 0);

    // Clean up: remove hidden attribute and delete file
    unsafe {
        SetFileAttributesW(path_wide.as_ptr(), 0);
    }
    fs::remove_file(temp_file_path).unwrap();
}

/// Test for get_file_metadata with read-only file
#[test]
fn test_get_file_metadata_read_only_file() {
    let temp_file_path = create_temp_file("test_read_only_file.txt");
    let path_str = temp_file_path.to_str().unwrap();

    // Set the file to read-only
    let mut perms = fs::metadata(&temp_file_path).unwrap().permissions();
    perms.set_readonly(true);
    fs::set_permissions(&temp_file_path, perms.clone()).unwrap();

    let metadata_result = get_file_metadata(path_str);
    assert!(metadata_result.is_ok());
    let metadata = metadata_result.unwrap();
    assert_eq!(metadata.get("Readonly").unwrap(), "true");

    // Clean up: set back to writable and delete file
    perms.set_readonly(false);
    fs::set_permissions(&temp_file_path, perms).unwrap();
    fs::remove_file(temp_file_path).unwrap();
}
