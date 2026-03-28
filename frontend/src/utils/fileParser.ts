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

/**
 * Ordered list of paths tried when looking for a default catalog in public/data/.
 * Place a file matching one of these names in public/data/ and it will be
 * auto-loaded on application startup (before any user upload).
 */
const DEFAULT_CATALOG_PATHS = [
  '/data/catalog.csv',
  '/data/catalog.xlsx',
  '/data/catalog.xls',
  '/data/produtos_catalogo.csv',
  '/data/produtos_catalogo.xlsx',
];

/**
 * Try to fetch a catalog file from public/data/.
 * Returns parsed data if a matching file is found, or null otherwise.
 */
export async function fetchDefaultCatalog(): Promise<{
  headers: string[];
  rows: SpreadsheetRow[];
  fileName: string;
} | null> {
  for (const path of DEFAULT_CATALOG_PATHS) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;

      // Vite (and most SPAs) return index.html with 200 for unknown paths.
      // The Content-Type header is available before reading the body — reject HTML early.
      const contentType = res.headers.get('Content-Type') ?? '';
      if (contentType.includes('text/html')) continue;

      // Use blob (not text) so raw bytes are preserved for any encoding (UTF-8, Latin-1, etc).
      const blob = await res.blob();

      // Safety net: peek at the first bytes as text to reject HTML disguised as other types.
      const peek = await blob.slice(0, 16).text();
      if (peek.trimStart().startsWith('<')) continue;

      const fileName = path.split('/').pop()!;
      const file = new File([blob], fileName, { type: blob.type });
      const parsed = await parseSpreadsheet(file);
      if (parsed.headers.length > 0) return { ...parsed, fileName };
    } catch {
      continue;
    }
  }
  return null;
}
