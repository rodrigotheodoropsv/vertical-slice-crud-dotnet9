import type { ColumnMapping, Product, SpreadsheetRow } from '../types';

/** Convert raw spreadsheet rows to typed Product objects using the column mapping. */
export function mapRowsToProducts(rows: SpreadsheetRow[], mapping: ColumnMapping): Product[] {
  return rows.map((row, idx) => {
    const extra: Record<string, string | number> = {};
    const mappedCols = new Set(Object.values(mapping));

    for (const key of Object.keys(row)) {
      if (!mappedCols.has(key)) {
        extra[key] = row[key];
      }
    }

    return {
      id: String(row[mapping.id] ?? idx + 1),
      nome: String(row[mapping.nome] ?? ''),
      categoria: String(row[mapping.categoria] ?? ''),
      unidade: String(row[mapping.unidade] ?? 'UN'),
      precoUnitario: Number(row[mapping.precoUnitario] ?? 0),
      estoque: Number(row[mapping.estoque] ?? 0),
      extra,
    };
  });
}

/** Format a number as Brazilian currency. */
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Format a date string (ISO) to Brazilian format dd/mm/yyyy. */
export function formatDateBR(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

/** Generate a unique order number based on date + random suffix. */
export function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `PV${yy}${mm}${dd}-${rnd}`;
}

/** Try to automatically guess column mapping from headers. */
export function guessColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const lower = headers.map((h) => h.toLowerCase());
  const find = (...terms: string[]) =>
    headers[lower.findIndex((h) => terms.some((t) => h.includes(t)))] ?? '';

  return {
    id: find('id', 'código', 'codigo', 'cod'),
    nome: find('nome', 'produto', 'descricao', 'descrição', 'name'),
    categoria: find('categoria', 'grupo', 'tipo', 'family', 'família'),
    unidade: find('unidade', 'un', 'unit', 'medida'),
    precoUnitario: find('preço', 'preco', 'price', 'valor', 'value', 'custo'),
    estoque: find('estoque', 'saldo', 'qty', 'quantidade disponivel', 'disponivel'),
  };
}
