// monitor.ts
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';
import { FileChangeEntry } from '../utils/types';
import { FileEvent, FileDetail } from '../utils/types';

export interface FileMonitorState {
    directories: string[];
    fileChanges: Record<string, Record<string, number>>;
    fileDetails: Record<string, Record<string, FileDetail>>;
}

export class FileMonitor {
    private state: FileMonitorState;
    private updateState: (state: FileMonitorState) => void;
    private isMonitoring: boolean = false;

    constructor(updateState: (state: FileMonitorState) => void) {
        this.state = {
            directories: [],
            fileChanges: {},
            fileDetails: {},
        };
        this.updateState = updateState;
        this.setupListener();
    }

    private setupListener() {
        listen('file-change-event', (event) => {
            const fileEvent = JSON.parse(event.payload as string) as FileEvent;

            if (fileEvent.watcher && fileEvent.watcher !== 'Unknown') {
                const newFileChanges = { ...this.state.fileChanges };
                const newFileDetails = { ...this.state.fileDetails };

                if (!newFileChanges[fileEvent.watcher]) {
                    newFileChanges[fileEvent.watcher] = {};
                }
                if (!newFileDetails[fileEvent.watcher]) {
                    newFileDetails[fileEvent.watcher] = {};
                }

                // Convert FileEventMetadata to Record<string, string>
                const convertedMetadata: Record<string, string> = {
                    Size: fileEvent.metadata.size,
                    Created: fileEvent.metadata.created,
                    Modified: fileEvent.metadata.modified,
                    Accessed: fileEvent.metadata.accessed,
                    Readonly: fileEvent.metadata.readonly,
                    IsEncrypted: fileEvent.metadata.is_encrypted,
                    IsHidden: fileEvent.metadata.is_hidden,
                    IsTemporary: fileEvent.metadata.is_temporary,
                };

                const commonData = {
                    Path: fileEvent.path,
                    PID: fileEvent.pid,
                    Type: fileEvent.event_type,
                    DisplayType: fileEvent.event_type,
                    Timestamp: fileEvent.timestamp,
                    Metadata: convertedMetadata,
                    Watcher: fileEvent.watcher,
                    Size: fileEvent.size,
                    Time: fileEvent.timestamp,
                    IRPOperation: fileEvent.irp_operation,
                    Entropy: fileEvent.entropy,
                    Extension: fileEvent.extension,
                    GID: fileEvent.gid,
                    process_name: fileEvent.process_name,
                    process_path: fileEvent.process_path,
                };

                if (!newFileDetails[fileEvent.watcher][fileEvent.path]) {
                    newFileDetails[fileEvent.watcher][fileEvent.path] = {
                        ...commonData,
                        entries: [],
                    };
                } else {
                    Object.assign(newFileDetails[fileEvent.watcher][fileEvent.path], commonData);
                }

                const detail = newFileDetails[fileEvent.watcher][fileEvent.path];
                const newEntry: FileChangeEntry = {
                    ...commonData,
                };
                detail.entries.push(newEntry);
                newFileChanges[fileEvent.watcher][fileEvent.path] = 
                    (newFileChanges[fileEvent.watcher][fileEvent.path] || 0) + 1;

                const newState: FileMonitorState = {
                    ...this.state,
                    fileChanges: newFileChanges,
                    fileDetails: newFileDetails,
                };

                this.state = newState;
                this.updateState(this.state);
            }
        });
    }

    // Rest of the class remains unchanged
    public async addDirectoryByPath(directory: string): Promise<void> {
        if (!this.state.directories.includes(directory)) {
            console.log(`Adding directory: ${directory}`);
            const newDirectories = [...this.state.directories, directory];
            const newState: FileMonitorState = {
                ...this.state,
                directories: newDirectories,
                fileChanges: {
                    ...this.state.fileChanges,
                    [directory]: this.state.fileChanges[directory] || {},
                },
                fileDetails: {
                    ...this.state.fileDetails,
                    [directory]: this.state.fileDetails[directory] || {},
                },
            };
            this.state = newState;
            this.updateState(this.state);
            // console.log(`Directory state updated for: ${directory}`);

            if (this.isMonitoring) {
                await this.updateMonitoringDirectories();
            }
        } else {
            console.log(`Directory already being monitored: ${directory}`);
        }
    }

    public async startMonitoring(): Promise<void> {
        if (!this.isMonitoring) {
            try {
                console.log('Initializing monitoring system');
                await invoke('start_monitoring', { directories: [] });
                this.isMonitoring = true;
                console.log('Monitoring system initialized successfully');
            } catch (error) {
                console.error('Error initializing monitoring:', error);
                throw error;
            }
        } else {
            console.log('Monitoring system is already initialized');
        }
    }

    public async getWatchedDirectories(): Promise<string[]> {
        try {
            return (await invoke('get_watched_directories')) as string[];
        } catch (error) {
            console.error('Error fetching watched directories:', error);
            throw error;
        }
    }

    private async updateMonitoringDirectories(): Promise<void> {
        try {
            await invoke('update_monitoring_directories', {
                directories: this.state.directories,
            });
            console.log('Updated monitoring directories:', this.state.directories);
        } catch (error) {
            console.error('Error updating monitoring directories:', error);
            throw error;
        }
    }

    public async removeDirectory(directory: string): Promise<void> {
        if (this.state.directories.includes(directory)) {
            try {
                await invoke('remove_directory', { directory });
                const newState: FileMonitorState = {
                    ...this.state,
                    directories: this.state.directories.filter((dir) => dir !== directory),
                };
                this.state = newState;
                this.updateState(this.state);
                console.log(`Directory removed: ${directory}`);

                if (this.isMonitoring) {
                    await this.updateMonitoringDirectories();
                }
            } catch (error) {
                console.error('Error removing directory:', error);
                throw error;
            }
        } else {
            console.log(`Directory not found in monitored list: ${directory}`);
        }
    }
}