# File Mod Tracker (CyberSec App)

### A Cybersecurity App for Monitoring Real-Time File Changes
This open-source app leverages a Tauri backend written in Rust with a React TypeScript frontend to track file modifications in real-time within specified directories on a Windows machine. The app is designed to be user-friendly, resource-efficient, and to maintain a minimal memory footprint, making it suitable for continuous monitoring tasks in cybersecurity contexts. We have also added functionality to display metadata associated with each file change.

### Prerequisites:
- Rust 
- Node.js

### Installation:
1. Clone this repository ```git clone https://github.com/GeoffreyFClark/file-mod-tracker``` and ```cd file-mod-tracker```
2. Install dependencies
```npm install```
3. Run development server
```npm run tauri dev```
or build production version
```npm run tauri build```

### Registry Modification Tracking
The app now also has registry modification tracking functionality.
