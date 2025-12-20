# GatorSec File Integrity Monitoring (CyberSec App)

## A Cybersecurity App for Monitoring Real-Time File Changes

A comprehensive file integrity monitoring solution combining kernel-level instrumentation with an intuitive desktop interface. The application leverages a Windows minifilter driver ([fsfilter-rs](https://github.com/SubconsciousCompute/fsfilter-rs)) to intercept file system operations at the kernel level, while the Rust backend processes events, applies intelligent filtering, and manages monitoring policies. This architecture enables zero-overhead detection of malicious file modifications, ransomware activity, and unauthorized access patterns across the system.

![File Monitoring Logs - All Events](screenshots/all_events_view.png)
![Add/Toggle Directories](screenshots/add_toggle_directories.png)
![Settings](screenshots/settings.png)

**Architecture:**
- **Kernel Driver (snFilter.sys)**: Windows minifilter that hooks into the file system to capture I/O operations
- **Rust Backend**: Communicates with the driver via Windows Filter Manager API, processes events, applies configurable filtering rules, manages persistent settings
- **React Frontend**: Desktop UI built with Tauri for real-time event visualization, directory management, process forensics, and session logging

## Usage:
1. [Download and run MSI File](https://github.com/GeoffreyFClark/file-mod-tracker/releases/download/FIM/GatorSec_0.0.0_x64_en-US.msi)
2. Provide a location for the installation 
3. Run the installation process 
4. Unclick the Launch after install option
5. Click "Yes" when prompted to restart machine
6. Run the GatorSec.exe file via the shortcut created on your desktop 


## User Guide

### Dashboard Overview
- **File Monitor**: Displays real-time file changes in monitored directories
- **Registry Monitor**: Shows registry key modifications
- **Process Information**: View processes modifying files with PID, path, and metadata
- **Actions**: Copy paths, open file locations, view properties, kill processes, monitor new directories

### Adding Directories to Monitor
1. Navigate to **Settings** tab
2. Click **Add Directory**
3. Select folder to monitor
4. Directory appears in monitored list and tracking begins immediately

Alternatively, click the **Add** icon next to any file path in the dashboard to monitor its parent directory.

### Managing Monitored Directories
- **Enable/Disable**: Toggle monitoring without removing the directory
- **Remove**: Click trash icon to stop monitoring and remove from list
- Settings persist between sessions

### Viewing File Changes
The dashboard table displays:
- **Path**: Full file path (click to copy, open location, or add to monitoring)
- **Status**: Created, Modified, Deleted, or Renamed
- **Timestamp**: When the change occurred
- **Process**: Which process made the change (click to open location, view properties, or terminate)
- **Process Path**: Full path to the executable

### Working with Processes
Process actions include:
- **Open Location**: Navigate to process executable in File Explorer
- **View Properties**: Windows properties dialog for the executable
- **Terminate**: Kill the process (requires confirmation)

### Registry Monitoring
Registry changes show:
- **Key Path**: Full registry path (click to copy or open in Registry Editor)
- **Operation**: Key created, modified, or deleted
- **Timestamp**: When the change occurred

### Session Logs
File and registry changes are logged to:
- Location: `%APPDATA%\com.gatorsec.dev\logs\`
- Format: `file_session_YYYY-MM-DD_HH-MM-SS.log` and `registry_session_YYYY-MM-DD_HH-MM-SS.log`
- Content: JSON array of all changes during the session
- Logs are cleared on app restart (session-based design)

## Troubleshooting

### Driver Not Loading
Check driver status: `fltmc filters | findstr snFilter`

If not listed, verify test signing is enabled and reboot was completed after driver installation.

### No File Events Appearing
- Verify directory is enabled in Settings
- Check if process is in exclusion list (SearchProtocolHost.exe, SearchIndexer.exe are excluded by default)
- Ensure you have read permissions for the monitored directory

## Manually Building from Source

### Prerequisites
- [Rust](https://rustup.rs/) (with MSVC toolchain for Windows)
- [Node.js](https://nodejs.org/) (v16 or later)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) with "Desktop development with C++"

**Note:** The minifilter driver (`snFilter.sys`) is a kernel-mode Windows driver that can intercept file system operations. It is pre-compiled from [fsfilter-rs](https://github.com/SubconsciousCompute/fsfilter-rs) and included as a binary in `src-tauri/drivers/`. You do not need the Windows Driver Kit (WDK) to build this project.

### Manual Build Steps

1. Clone the repository:
```bash
git clone https://github.com/GeoffreyFClark/file-mod-tracker
cd file-mod-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run tauri build -- --bundles none
```

This creates `GatorSec.exe` at `src-tauri/target/release/GatorSec.exe`

### Driver Installation (One-Time Setup)

The minifilter driver must be installed separately. This is a one-time process that requires a system reboot.

**Important:** Keep the repository in a stable location, as the driver installation references files in `src-tauri/drivers/`.

**Step 1: Enable test signing (Administrator PowerShell)**
```powershell
bcdedit -set TESTSIGNING ON
Restart-Computer
```

**Step 2: After reboot, install the driver (Administrator PowerShell)**
```powershell
cd src-tauri\drivers

# Install self-signed certificate
certutil -addstore -enterprise "Root" "snFilter.cer"

# Install driver
pnputil -i -a "snFilter.inf"

# Load the minifilter driver
fltmc load snFilter

# Verify driver is running
fltmc filters | findstr snFilter
```

If `fltmc` shows `snFilter` in the output, the driver is successfully installed.

**Step 3: Run the application**
```powershell
src-tauri\target\release\GatorSec.exe
```

### Development Mode

For development without driver functionality:
```bash
npm run tauri dev
```

**Note:** Development mode will launch the app, but file monitoring will not work until the driver is installed using the steps above. Once the driver is installed, it persists across reboots and `npm run tauri dev` will work fully.

### Architecture Notes

- **Application Code**: Rust backend (`src-tauri/`) + React TypeScript frontend (`src/`)
- **Minifilter Driver**: Pre-compiled binary from [fsfilter-rs](https://github.com/SubconsciousCompute/fsfilter-rs)
- **Communication**: Application connects to driver via `FilterConnectCommunicationPort` API
- **Build Output**: Portable `.exe` (no installer required)
