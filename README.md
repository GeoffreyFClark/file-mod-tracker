# GatorSec File Integrity Monitoring (CyberSec App)

## A Cybersecurity App for Monitoring Real-Time File Changes
This open-source app leverages a Tauri backend written in Rust with a React TypeScript frontend to track file and registry modifications in real-time within specified directories and registry keys on a Windows machine. The app is designed to be user-friendly, resource-efficient, and to maintain a minimal memory footprint, making it suitable for continuous monitoring tasks in cybersecurity contexts. We have also added functionality to display metadata associated with each file change.

## Usage:
1. [Download and run MSI File](https://github.com/GeoffreyFClark/file-mod-tracker/releases/download/FIM/GatorSec_0.0.0_x64_en-US.msi)
2. Provide a location for the installation 
3. Run the installation process 
4. Unclick the Launch after install option
5. Click "Yes" when prompted to restart machine
6. Run the GatorSec.exe file via the shortcut created on your desktop 


## Manual App Build Process for Development

Prerequisites:
- Rust 
- Node.js
- [Wix Toolset v3.11.2] (https://github.com/wixtoolset/wix3/releases/tag/wix3112rtm)

Wix Toolset Install:
After installing the recommended Wix version, the bin file must be added as a user variable for the current user. 
1. Launch the Environment Variables tool on your machine
2. Double-click "Path" under "User variables for User"
3. Click new and paste the path to the bin file in the Wix install folder 

Building:
1. Clone this repository ```git clone https://github.com/GeoffreyFClark/file-mod-tracker``` and ```cd file-mod-tracker```
2. Install dependencies
```npm install```
3. Run development server
```npm run tauri dev```
or build production version
```npm run tauri build```
