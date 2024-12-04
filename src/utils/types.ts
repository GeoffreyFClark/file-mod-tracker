import { SvgIconProps } from '@mui/material';

export interface CustomCellProps {
  value: string;
  actions: ActionItem[];
  actionValue?: string | ProcessInfo;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  path: string;
}

export interface KillProcessResponse {
  success: boolean;
  message: string;
}

export interface ActionItem {
  icon: React.ComponentType<SvgIconProps>;
  onClick: (value: string | ProcessInfo) => Promise<string | void>;
  message?: string;
}

export interface PathCellProps {
  value: string;
  actions: ActionItem[];
}


export interface FileChangeEntry {
  Path: string;
  PID: number | string;
  Type: string;
  IRPOperation: string;
  Timestamp: string;
  Size: string;
  Metadata: Record<string, string>;
  GID: number | string;
  process_name: string;
  process_path: string;
}

export interface ParentTableDataRow {
  Path: string;
  PID: '*';
  Type: '*';
  Timestamp: string;
  Changes: number;
  entries: FileChangeEntry[];
  Size: string; // Add this line
}

export interface WatcherTableDataRow {
  Watcher: string;
  files: ParentTableDataRow[];
}


// TableDataRow becomes a union type to allow both parent and child structures
export type TableDataRow = ParentTableDataRow | FileChangeEntry;

// Update RawDataItem to match the new structure
export interface RawDataItem {
  Path: string;
  PID: '*';
  Type: '*';
  Timestamp: string;
  Changes: number;
  entries: RawDataEntry[];
}

export interface LogsTableProps {
  parsedData: DataRow[];
  rawData?: TableDataRow[];
}

export interface Directory {
  path: string;
  is_monitored: boolean;
}

// simpleDatatablesTypes.ts

export type nodeType = 
  | {
      nodeName: string;
      attributes?: { [key: string]: string };
      childNodes?: nodeType[];
      checked?: boolean;
      value?: string | number;
      selected?: boolean;
    }
  | {
      nodeName: "#text" | "#comment";
      data: string;
      childNodes?: never;
    };

export type cellDataType = string | number | boolean | nodeType | object;

export interface cellType {
  data: cellDataType;
  text?: string;
  order?: string | number;
  attributes?: { [key: string]: string };
}

export type inputCellType = cellType | string | number | boolean;

export interface inputRowType {
  attributes?: { [key: string]: string };
  cells: inputCellType[];
}


export interface DataCell {
  data: string | number;
  text?: string;
}

export interface DataRow {
  cells: DataCell[];
}

export interface Data {
  headings: { data: string }[];
  data: DataRow[];
}


export interface DataRow {
  cells: DataCell[];
}

export interface Data {
  headings: { data: string }[];
  data: DataRow[];
}


export interface RawDataEntry {
  Path: string;
  PID: string | number;
  Type: string;
  DisplayType?: string;
  Timestamp: string;
  Metadata: Record<string, string>;
}

export interface RegistryTableDataRow {
  Key: string;         // The registry key as the main grouping
  entries: RegistryChangeEntry[];
  Changes: number;     // Total number of changes to this key
}

export interface RegistryChangeEntry {
  Type: string;        // UPDATED, ADDED, REMOVED
  Value: string;       // The registry value that changed
  PreviousData: string;
  NewData: string;
  Timestamp: string;
}

export interface RegistryEvent {
  type: string;         // UPDATED, ADDED, REMOVED
  key: string;          // Registry key that was changed
  value: string;        // Registry value that was changed
  previousData?: string; // Previous data if available
  newData?: string;     // New data if available
  timestamp: string;    // Timestamp of the change
}


export interface RegistryMonitorContextType {
  isMonitoring: boolean;
  registryEvents: RegistryEvent[];
  registryTableData: RegistryTableDataRow[];
  monitoredKeys: string[];
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  getChangeCount: (key: string) => number;
  getLastModified: (key: string) => string | null;
  clearStorage: () => void;
  addRegistryKey: (keyPath: string) => Promise<void>;
  removeRegistryKey: (keyPath: string) => Promise<void>;
}

export interface RegistryCache {
  [key: string]: {
    changeCount: number;
    lastModified: string;
  }
}


export interface TabConfig {
  label: string;
  content: React.ReactNode;
}

export interface TabbedPageLayoutProps {
  title: string;
  tabs: TabConfig[];
}


export interface FileEventMetadata {
  size: string;
  created: string;
  modified: string;
  accessed: string;
  readonly: string;
  is_encrypted: string;
  is_hidden: string;
  is_temporary: string;
}

export interface FileEvent {
  path: string;
  pid: string;
  event_type: string;
  timestamp: string;
  metadata: FileEventMetadata;
  watcher: string;
  size: string;
  irp_operation: string;
  entropy: number;
  extension: string;
  gid: string;
  process_name: string;
  process_path: string;
}

export interface FileBase {
  Path: string;
  PID: number | string;
  Type: string;
  Timestamp: string;
  DisplayType: string;
  Metadata: Record<string, string>;
  Watcher: string;
  Size: string;
  Time: string;
  IRPOperation: string;
  Entropy: number;
  Extension: string;
  GID: number | string;
  process_name: string;
  process_path: string;
}

export interface FileDetail extends FileBase {
  entries: FileChangeEntry[];
}
