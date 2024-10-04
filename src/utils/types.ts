export interface FileChangeEntry {
  Path: string;
  PID: number | string;
  Type: string;
  Timestamp: string;
  Size: string; // Add this line
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

