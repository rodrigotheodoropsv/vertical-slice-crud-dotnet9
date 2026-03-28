import type { FieldMapping } from '../types';

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

/** Get a numeric value from a row for a given column key. */
export function getNumber(row: Record<string, string | number>, col: string): number {
  return Number(row[col] ?? 0);
}

/** Try to automatically guess field mapping from file headers. */
export function guessFieldMapping(headers: string[]): FieldMapping {
  const lower = headers.map((h) => h.toLowerCase());
  const find = (...terms: string[]) =>
    headers[lower.findIndex((h) => terms.some((t) => h.includes(t)))] ?? headers[0] ?? '';

  return {
    idCol:      find('id', 'código', 'codigo', 'cod', 'sku', 'ref'),
    nomeCol:    find('nome', 'produto', 'descricao', 'descrição', 'description', 'name'),
    precoCol:   find('preço', 'preco', 'price', 'valor', 'value', 'custo', 'vlr'),
    estoqueCol: find('estoque', 'saldo', 'qty', 'quantidade disponivel', 'disponivel', 'stock'),
  };
}
