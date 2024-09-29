export interface FileChangeEntry {
  Path: string;
  PID: number | string;
  Type: string;
  Timestamp: string;
}

export interface TableDataRow {
  Path: string;
  PID: number | string;
  Type: string;
  Timestamp: string;
  Changes: number;
  entries: FileChangeEntry[];
}

export interface LogsTableProps {
  data: TableDataRow[];
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

export interface LogsTableProps {
  data: TableDataRow[];
  dataTableRef: React.MutableRefObject<any>;
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

export interface TableDataRow {
  Path: string;
  PID: string | number;
  Type: string;
  Timestamp: string;
  Changes: number;
}

export interface RawDataEntry {
  Path: string;
  PID: string | number;
  Type: string;
  DisplayType?: string;
  Timestamp: string;
  Metadata: Record<string, string>;
}

export interface RawDataItem {
  Path: string;
  PID: string | number;
  Type: string;
  Timestamp: string;
  Changes: number;
  entries: RawDataEntry[];
}