import { DataTable } from 'simple-datatables';
import { Data, DataRow } from './types';


export const addRowsToDataTable = (dataTable: DataTable | null, newRows: DataRow[]) => {
    if (dataTable) {
      dataTable.data.data = [
        ...dataTable.data.data,
        ...newRows
      ];
      dataTable.update();
    }
  };