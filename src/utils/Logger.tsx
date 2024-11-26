import { BaseDirectory, createDir, writeTextFile } from '@tauri-apps/api/fs';
// import { appDataDir } from '@tauri-apps/api/path';
import { WatcherTableDataRow, RegistryTableDataRow } from '../utils/types';

abstract class BaseLogger<T> {
  protected logQueue: Promise<void> = Promise.resolve();
  protected debounceTimer: NodeJS.Timeout | null = null;
  protected pendingData: T[] | null = null;
  protected readonly DEBOUNCE_MS = 100;
  protected sessionLogFile: string;

  constructor(prefix: string) {
    this.sessionLogFile = `${prefix}_${this.formatDateTime()}.log`;
    // this.logBaseDirectory();
  }

  // protected async logBaseDirectory() {
  //   try {
  //     const appDataPath = await appDataDir();
  //     console.log('Log files will be stored in:', `${appDataPath}/logs/`);
  //     console.log('Current session log file:', this.sessionLogFile);
  //   } catch (error) {
  //     console.error('Error getting app data directory:', error);
  //   }
  // }

  protected formatDateTime(): string {
    const now = new Date();
    return now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('Z')[0];
  }

  protected async ensureLogDirectory(): Promise<void> {
    try {
      await createDir('logs', {
        dir: BaseDirectory.AppData,
        recursive: true
      });
    } catch (error: any) {
      if (!error.toString().includes('AlreadyExists')) {
        console.error('Error creating logs directory:', error);
        throw error;
      }
    }
  }

  protected async writeLogToFile(data: T[]): Promise<void> {
    try {
      if (!data) {
        console.error('Attempted to write null data to log file');
        return;
      }

      if (!Array.isArray(data)) {
        console.error('Data is not an array:', typeof data);
        return;
      }

      await this.ensureLogDirectory();
      const logContent = JSON.stringify(data, null, 2);
      
      if (logContent === 'null' || logContent === '[]') {
        console.warn('Warning: About to write empty data to log file');
      }

      await writeTextFile(`logs/${this.sessionLogFile}`, logContent, {
        dir: BaseDirectory.AppData
      });

    } catch (error) {
      console.error('Error writing log file:', error);
      throw error;
    }
  }

  public logData(data: T[]): Promise<void> {
    if (!data) {
      console.error('Null data passed to logData');
      return Promise.resolve();
    }

    if (!Array.isArray(data)) {
      console.error('Invalid data type passed to logData:', typeof data);
      return Promise.resolve();
    }

    this.pendingData = data;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    return new Promise((resolve, reject) => {
      this.debounceTimer = setTimeout(() => {
        const dataToWrite = this.pendingData;
        this.pendingData = null;

        if (!dataToWrite) {
          console.error('Data became null during debounce period');
          resolve();
          return;
        }

        this.logQueue = this.logQueue
          .then(() => this.writeLogToFile(dataToWrite))
          .then(resolve)
          .catch(reject);
      }, this.DEBOUNCE_MS);
    });
  }

  public forceWrite(): Promise<void> {
    if (this.pendingData) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }

      const dataToWrite = this.pendingData;
      this.pendingData = null;
      return this.writeLogToFile(dataToWrite);
    }
    return Promise.resolve();
  }

  public getCurrentLogFile(): string {
    return this.sessionLogFile;
  }
}

export class FileLogger extends BaseLogger<WatcherTableDataRow> {
  private static instance: FileLogger;

  private constructor() {
    super('file_session');
  }

  public static getInstance(): FileLogger {
    if (!FileLogger.instance) {
      FileLogger.instance = new FileLogger();
    }
    return FileLogger.instance;
  }

  public logTableData(tableData: WatcherTableDataRow[]): Promise<void> {
    return this.logData(tableData);
  }
}

export class RegistryLogger extends BaseLogger<RegistryTableDataRow> {
  private static instance: RegistryLogger;

  private constructor() {
    super('registry_session');
  }

  public static getInstance(): RegistryLogger {
    if (!RegistryLogger.instance) {
      RegistryLogger.instance = new RegistryLogger();
    }
    return RegistryLogger.instance;
  }

  public logTableData(tableData: RegistryTableDataRow[]): Promise<void> {
    return this.logData(tableData);
  }
}

export const fileLogger = FileLogger.getInstance();
export const registryLogger = RegistryLogger.getInstance();