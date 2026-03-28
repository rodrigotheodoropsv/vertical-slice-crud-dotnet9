import Papa, { type ParseResult } from 'papaparse';
import ExcelJS from 'exceljs';
import type { SpreadsheetRow } from '../types';

/** Parse a CSV file and return headers + rows. */
export async function parseCsv(file: File): Promise<{ headers: string[]; rows: SpreadsheetRow[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<SpreadsheetRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result: ParseResult<SpreadsheetRow>) => {
        const headers = result.meta.fields ?? [];
        resolve({ headers, rows: result.data });
      },
      error: (err: Error) => reject(err),
    });
  });
}

/** Parse an XLSX file using ExcelJS and return headers + rows. */
export async function parseXlsx(file: File): Promise<{ headers: string[]; rows: SpreadsheetRow[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('Nenhuma planilha encontrada no arquivo.');

  const headers: string[] = [];
  const rows: SpreadsheetRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        headers.push(String(cell.value ?? '').trim());
      });
      return;
    }

    const rowObj: SpreadsheetRow = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (!header) return;
      const val = cell.value;
      rowObj[header] = typeof val === 'object' && val !== null ? String(val) : (val as string | number) ?? '';
    });
    if (Object.values(rowObj).some((v) => v !== '' && v !== null && v !== undefined)) {
      rows.push(rowObj);
    }
  });

  return { headers, rows };
}

/** Auto-detect file type and parse it. */
export async function parseSpreadsheet(
  file: File,
): Promise<{ headers: string[]; rows: SpreadsheetRow[] }> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseXlsx(file);
  }
  return parseCsv(file);
}
