import Papa, { type ParseResult } from 'papaparse';
import ExcelJS from 'exceljs';
import type { SpreadsheetRow } from '../types';
import { applyColumnMapping } from './columnMappings';

/** Index of the worksheet that contains the product catalog (0-based, so 1 = second sheet). */
const CATALOG_SHEET_INDEX = 1;

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
export async function parseXlsx(
  file: File,
  sheetIndex = 0,
): Promise<{ headers: string[]; rows: SpreadsheetRow[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Try the requested sheet; fall back to first sheet if it doesn't exist or is empty.
  const worksheet =
    workbook.worksheets[sheetIndex] ??
    workbook.worksheets[0];
  if (!worksheet) throw new Error('Nenhuma planilha encontrada no arquivo.');

  // Track headers by 1-based column number so every data row is fetched via
  // the same index — avoids ghost columns from ExcelJS eachCell iteration quirks.
  const colToHeader = new Map<number, string>();
  const seenNames = new Set<string>();

  worksheet.getRow(1).eachCell((cell, colNum) => {
    // Skip columns the file itself marks as hidden — they are invisible in Excel
    // and should not appear in the UI (e.g. ERP internal fields like ST, flags, etc.)
    const col = worksheet.getColumn(colNum);
    if (col.hidden) return;
    // Also treat zero-width columns as hidden (another way Excel can hide a column)
    if (typeof col.width === 'number' && col.width === 0) return;

    // cell.text returns the *formatted* string (preserves leading zeros, dates, etc.)
    const raw = (cell.text ?? String(cell.value ?? '')).trim();
    if (!raw) return; // skip blank / ghost header cells
    // Disambiguate duplicate header names with a column-number suffix
    const name = seenNames.has(raw) ? `${raw}_${colNum}` : raw;
    colToHeader.set(colNum, name);
    seenNames.add(name);
  });

  const headers = Array.from(colToHeader.values());
  const rows: SpreadsheetRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rowObj: SpreadsheetRow = {};
    let hasData = false;

    colToHeader.forEach((headerName, colNum) => {
      const cell = row.getCell(colNum);
      // Use formatted text to preserve leading zeros (e.g. group codes '001', '051')
      let text = '';
      try { text = (cell.text ?? '').trim(); } catch { text = String(cell.value ?? '').trim(); }
      rowObj[headerName] = text;
      if (text) hasData = true;
    });

    if (hasData) rows.push(rowObj);
  });

  return { headers, rows };
}

/** Auto-detect file type and parse it. */
export async function parseSpreadsheet(
  file: File,
  sheetIndex = 0,
): Promise<{ headers: string[]; rows: SpreadsheetRow[] }> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseXlsx(file, sheetIndex);
  }
  return parseCsv(file);
}

/**
 * Parse a catalog file — reads the second worksheet (index 1) for XLSX files
 * and applies the friendly-name column mapping automatically.
 * Falls back gracefully to the first sheet for single-sheet files.
 */
export async function parseCatalogFile(
  file: File,
): Promise<{ headers: string[]; rows: SpreadsheetRow[] }> {
  const raw = await parseSpreadsheet(file, CATALOG_SHEET_INDEX);
  return applyColumnMapping(raw.headers, raw.rows);
}

/**
 * Ordered list of paths tried when looking for a default catalog in public/data/.
 * Place a file matching one of these names in public/data/ and it will be
 * auto-loaded on application startup (before any user upload).
 */
const DEFAULT_CATALOG_PATHS = [
  '/catalogo/produtos.xlsx',
  '/catalogo/produtos.xls',
  '/catalogo/produtos.csv',
  '/catalogo/catalog.csv',
  '/catalogo/catalog.xlsx',
  '/catalogo/catalog.xls',
  '/catalogo/produtos_catalogo.csv',
  '/catalogo/produtos_catalogo.xlsx',
];

/**
 * Try to fetch a catalog file from public/catalogo/.
 * Returns parsed data + HTTP metadata for change-detection, or null if not found.
 */
export interface CatalogFetchResult {
  headers: string[];
  rows: SpreadsheetRow[];
  fileName: string;
  lastModified: string | null;
  resolvedPath: string;
}

export async function fetchDefaultCatalog(): Promise<CatalogFetchResult | null> {
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
      const parsed = await parseCatalogFile(file);
      if (parsed.headers.length === 0) continue;

      const lastModified = res.headers.get('Last-Modified') ?? res.headers.get('ETag');
      return { ...parsed, fileName, lastModified, resolvedPath: path };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Lightweight HEAD request to detect catalog file changes since last fetch.
 * Returns true when a reload is warranted.
 */
export async function checkCatalogFileChanged(
  resolvedPath: string,
  knownLastModified: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(resolvedPath, { method: 'HEAD' });
    if (!res.ok) return false;
    const lm = res.headers.get('Last-Modified') ?? res.headers.get('ETag');
    if (lm == null && knownLastModified == null) return false;
    return lm !== knownLastModified;
  } catch {
    return false;
  }
}
