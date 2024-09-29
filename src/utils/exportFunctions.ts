import { DataTable, exportCSV, exportJSON, exportSQL, exportTXT } from 'simple-datatables';

export const handleExportCSV = (dataTable: DataTable) => {
  exportCSV(dataTable, { lineDelimiter: "\n", columnDelimiter: ";" });
};

export const handleExportJSON = (dataTable: DataTable) => {
  exportJSON(dataTable, { space: 3 });
};

export const handleExportTXT = (dataTable: DataTable) => {
  exportTXT(dataTable);
};

export const handleExportSQL = (dataTable: DataTable) => {
  exportSQL(dataTable, { tableName: "export_table" });
};