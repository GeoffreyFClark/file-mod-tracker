fn main() {
    // Embed Windows manifest for admin elevation
    #[cfg(windows)]
    {
        let mut windows = tauri_build::WindowsAttributes::new();
        windows = windows.app_manifest(include_str!("tauri.windows.manifest"));
        tauri_build::try_build(tauri_build::Attributes::new().windows_attributes(windows))
            .expect("failed to run build script");
    }

    #[cfg(not(windows))]
    tauri_build::build()
}
