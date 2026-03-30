import ExcelJS from 'exceljs';

export interface ClientRecord {
  codigo: string;           // Código do Cliente
  razaoSocial: string;      // Cliente
  endereco: string;         // Street address (End. column only)
  bairro: string;           // Bairro
  cep: string;              // CEP
  cidade: string;           // Cidade
  estado: string;           // Estado / UF
  inscricaoEstadual: string; // Inscrição Estadual / IE
  cnpj: string;             // CNPJ
  telefone: string;         // Fone
  email: string;            // e-mail
  comprador: string;        // Comprador
}

/** 3rd worksheet (0-based index 2) is where client data lives. Falls back to first sheet. */
const SHEET_INDEX = 2;

/** Files tried in order when looking for the client spreadsheet in public/clientes/. */
const CLIENT_PATHS = [
  '/clientes/clientes.xlsx',
  '/clientes/clientes.xls',
  '/clientes/clientes.csv',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Normalise a header for fuzzy matching: lowercase, remove accents + punctuation. */
function norm(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Find the first header that matches any of the given patterns. */
function findCol(headers: string[], patterns: RegExp[]): string | undefined {
  return headers.find((h) => patterns.some((p) => p.test(norm(h))));
}

/** Coerce an ExcelJS cell value to a clean string. */
function cellStr(val: ExcelJS.CellValue): string {
  if (val == null) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return String(val);
  if (val instanceof Date) return val.toLocaleDateString('pt-BR');
  if (typeof val === 'object') {
    // RichText
    if ('richText' in val) {
      return (val as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join('').trim();
    }
    // Hypertlink
    if ('text' in val) return String((val as ExcelJS.CellHyperlinkValue).text).trim();
    // Formula result
    if ('result' in val) return cellStr((val as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
    // Shared formula
    if ('sharedFormula' in val) return cellStr((val as ExcelJS.CellSharedFormulaValue).result as ExcelJS.CellValue);
  }
  return String(val).trim();
}

// ─── Parser ─────────────────────────────────────────────────────────────────

async function parseFromBuffer(buf: ArrayBuffer): Promise<ClientRecord[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buf);

  const sheet = workbook.worksheets[SHEET_INDEX] ?? workbook.worksheets[0];
  if (!sheet) return [];

  // Read headers from first row
  const firstRow = sheet.getRow(1);
  const headers: string[] = [];
  firstRow.eachCell({ includeEmpty: true }, (cell) => {
    headers.push(cellStr(cell.value));
  });

  // Column discovery (fuzzy, accent-insensitive)
  const codigoCol    = findCol(headers, [/codigo|cod\.?\s*cli/]);
  const clienteCol   = findCol(headers, [/^cliente$/]);
  const endCol       = findCol(headers, [/^end\b|^endereco\b/]);
  const bairroCol    = findCol(headers, [/^bairro$/]);
  const cidadeCol    = findCol(headers, [/^cidade$/]);
  const estadoCol    = findCol(headers, [/^estado$|^uf$/]);
  const cepCol       = findCol(headers, [/^cep$/]);
  const cnpjCol      = findCol(headers, [/^cnpj$/]);
  const inscEstCol   = findCol(headers, [/inscr|estadual|^ie$|^i\.e\./]);
  const telefoneCol  = findCol(headers, [/^fone|^tel/]);
  const emailCol     = findCol(headers, [/email|e mail/]);
  const compradorCol = findCol(headers, [/^comprador$/]);

  function get(row: ExcelJS.Row, colName: string | undefined): string {
    if (!colName) return '';
    const idx = headers.indexOf(colName);
    if (idx < 0) return '';
    return cellStr(row.getCell(idx + 1).value);
  }

  const clients: ClientRecord[] = [];
  const rowCount = sheet.rowCount;

  for (let i = 2; i <= rowCount; i++) {
    const row = sheet.getRow(i);
    const razaoSocial = get(row, clienteCol);
    if (!razaoSocial) continue; // blank or separator row

    clients.push({
      codigo:            get(row, codigoCol),
      razaoSocial,
      endereco:          get(row, endCol),
      bairro:            get(row, bairroCol),
      cep:               get(row, cepCol),
      cidade:            get(row, cidadeCol),
      estado:            get(row, estadoCol),
      inscricaoEstadual: get(row, inscEstCol),
      cnpj:              get(row, cnpjCol),
      telefone:          get(row, telefoneCol),
      email:             get(row, emailCol),
      comprador:         get(row, compradorCol),
    });
  }

  return clients;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export interface ClientFetchResult {
  clients: ClientRecord[];
  /** Last-Modified or ETag value from the HTTP response (used for change detection). */
  lastModified: string | null;
  /** The file path that was successfully resolved (e.g. /clientes/clientes.xlsx). */
  resolvedPath: string | null;
}

/**
 * Try to fetch the client spreadsheet from public/clientes/.
 * Returns an empty clients array if the file isn't present or can't be parsed.
 */
export async function fetchClients(): Promise<ClientFetchResult> {
  for (const path of CLIENT_PATHS) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const ct = res.headers.get('Content-Type') ?? '';
      if (ct.includes('text/html')) continue;
      const buf = await res.arrayBuffer();
      const peek = new TextDecoder().decode(new Uint8Array(buf, 0, 16)).trimStart();
      if (peek.startsWith('<')) continue;
      const clients = await parseFromBuffer(buf);
      const lastModified = res.headers.get('Last-Modified') ?? res.headers.get('ETag');
      return { clients, lastModified, resolvedPath: path };
    } catch {
      continue;
    }
  }
  return { clients: [], lastModified: null, resolvedPath: null };
}

/**
 * Performs a lightweight HEAD request to check whether the file has changed
 * since the last fetch.  Returns true when a reload is warranted.
 */
export async function checkClientFileChanged(
  resolvedPath: string,
  knownLastModified: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(resolvedPath, { method: 'HEAD' });
    if (!res.ok) return false;
    const lm = res.headers.get('Last-Modified') ?? res.headers.get('ETag');
    // If neither side has a marker we cannot detect changes, so skip.
    if (lm == null && knownLastModified == null) return false;
    return lm !== knownLastModified;
  } catch {
    return false;
  }
}
