import type { SpreadsheetRow } from '../types';

/**
 * Mapping from raw/abbreviated column names (as found in ERP exports) to
 * user-friendly display names shown throughout the application.
 *
 * Keys are matched case-insensitively.  Add new entries here whenever a
 * supplier sends a file with different column names — no other file needs
 * to change.
 */
export const CATALOG_COLUMN_MAP: Record<string, string> = {
  // ── Identifiers ───────────────────────────────────────────────────────────
  GRU_CODIGO:        'Grupo',
  PRO_CODIGO:        'Código',
  COD_PRODUTO:       'Código',
  CODPROD:           'Código',
  SKU:               'SKU',
  CODIGO_BARRA:      'Código de Barras',
  COD_BARRA:         'Código de Barras',
  EAN:               'Código de Barras',
  GTIN:              'Código de Barras',

  // ── Description ──────────────────────────────────────────────────────────
  DESCRICAO:         'Descrição',
  DESCR:             'Descrição',
  DES_PRODUTO:       'Descrição',
  NOME_PRODUTO:      'Descrição',
  PRODUTO:           'Descrição',
  PRO_DESCRICAO:     'Descrição',
  DESCRIPTION:       'Descrição',
  NAME:              'Descrição',

  // ── Price ─────────────────────────────────────────────────────────────────
  PRECO_VENDA_CONSUMIDOR: 'Preço de Venda',
  PRECO_VENDA:       'Preço de Venda',
  PRE_VENDA:         'Preço de Venda',
  VLR_VENDA:         'Preço de Venda',
  PRECO:             'Preço de Venda',
  PRICE:             'Preço de Venda',
  PRO_PRECO:         'Preço de Venda',
  VLR_UNIT:          'Preço de Venda',
  VALOR:             'Preço de Venda',
  PRECO_CUSTO:       'Preço de Custo',
  CUSTO:             'Preço de Custo',

  // ── Stock ─────────────────────────────────────────────────────────────────
  ESTOQUE:           'Estoque',
  QTD_ESTOQUE:       'Estoque',
  SALDO:             'Estoque',
  QUANTIDADE:        'Estoque',
  QTD:               'Estoque',
  STOCK:             'Estoque',

  // ── Weight / dimensions ───────────────────────────────────────────────────
  E_PESOBRT:         'Peso Bruto',
  PESO_BRUTO:        'Peso Bruto',
  PESOBRT:           'Peso Bruto',
  E_PESOLIQ:         'Peso Líquido',
  PESO_LIQ:          'Peso Líquido',

  // ── Tax / classification ──────────────────────────────────────────────────
  E_CLASFIS:         'Class. Fiscal',
  CLASFIS:           'Class. Fiscal',
  NCM:               'NCM',
  E_IPI:             'IPI',
  IPI:               'IPI',
  ICMS:              'ICMS',
  ALIQ_IPI:          'IPI',

  // ── Units ─────────────────────────────────────────────────────────────────
  UNIDADE:           'Unidade',
  UN:                'Unidade',
  UOM:               'Unidade',
};

/**
 * Column names (post-rename) that are always excluded from the catalog UI,
 * regardless of whether they contain values.  These are ERP-internal fields
 * (e.g. ICMS-ST tax columns) that should never be visible to the sales agent.
 * Comparison is case-insensitive.
 */
const SUPPRESSED_COLUMNS = new Set([
  'ST',
  'TRIBUTAÇÃO',
  'TRIBUTACAO',
  'TRIB',
]);

/**
 * Apply `CATALOG_COLUMN_MAP` (or a custom map) to a parsed header + rows
 * result, renaming columns to friendly display names.
 *
 * Matching is case-insensitive and trims surrounding whitespace.
 * Columns not found in the map keep their original name.
 */
export function applyColumnMapping(
  headers: string[],
  rows: SpreadsheetRow[],
  map: Record<string, string> = CATALOG_COLUMN_MAP,
): { headers: string[]; rows: SpreadsheetRow[] } {
  // Build case-insensitive lookup once
  const lookup: Record<string, string> = {};
  for (const [raw, friendly] of Object.entries(map)) {
    lookup[raw.toUpperCase().trim()] = friendly;
  }

  // Rename headers; drop blank cells and duplicates (keep first occurrence only).
  const seen = new Set<string>();
  const validPairs: Array<{ renamed: string; original: string }> = [];

  headers.forEach((h) => {
    const trimmed = h.trim();
    if (!trimmed) return; // blank header — skip
    const friendly = lookup[trimmed.toUpperCase()] ?? trimmed;
    if (seen.has(friendly)) return; // duplicate friendly name — drop subsequent column
    if (SUPPRESSED_COLUMNS.has(friendly.toUpperCase().trim())) return; // ERP-internal column
    seen.add(friendly);
    validPairs.push({ renamed: friendly, original: h });
  });

  const renamedRows = rows.map((row) => {
    const newRow: SpreadsheetRow = {};
    validPairs.forEach(({ renamed: rh, original }) => {
      newRow[rh] = row[original];
    });
    return newRow;
  });

  // Drop columns where every single row has an empty value (ghost / unused columns)
  const finalPairs = validPairs.filter(({ renamed: rh }) =>
    renamedRows.some((r) => String(r[rh] ?? '').trim() !== ''),
  );

  const finalHeaders = finalPairs.map((p) => p.renamed);
  const finalRows = renamedRows.map((row) => {
    const newRow: SpreadsheetRow = {};
    finalPairs.forEach(({ renamed: rh }) => { newRow[rh] = row[rh]; });
    return newRow;
  });

  return { headers: finalHeaders, rows: finalRows };
}
