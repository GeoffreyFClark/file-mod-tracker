import { generateCsv, download, ConfigOptions } from 'export-to-csv';

export const csvConfig: ConfigOptions = {
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
};

export const generateCSV = generateCsv(csvConfig);
export const downloadCSV = download(csvConfig);
