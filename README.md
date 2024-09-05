# File Mod Tracker (CyberSec App)

### A Cybersecurity App for Monitoring Real-Time File Changes
This open-source app leverages a Tauri backend written in Rust with a React TypeScript frontend to track file modifications in real-time within specified directories on a Windows machine. The app is designed to be user-friendly, resource-efficient, and to maintain a minimal memory footprint, making it suitable for continuous monitoring tasks in cybersecurity contexts.

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

### TO DO:
- Add unit testing to improve the app's extensibility
  - Intending to use Rust's built-in testing framework
  - Jest for testing React components
  - CircleCI to automate testing/deployment
- Frontend updates 
  - eg Segment GUI for monitoring of multiple directories
  - Perhaps open a file explorer for directory selection
  - Perhaps an appealing filetree visualization of some sort
  - Perhaps CLI functionality along with the React GUI
- Extend backend functionality: 
  - Metadata regarding each file change
  - Filtering options/parameters for what file changes to emit in the specified directories
    - e.g. blacklist/ignore certain files/subdirectories
  - It'd be valuable to be able to associate each file change with the process that made it
  - Perhaps save to .txt log option
  - Perhaps real-time tracking of registry changes
  - etc etc etc