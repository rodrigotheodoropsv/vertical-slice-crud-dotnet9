// ─── Product & Catalog ────────────────────────────────────────────────────────

/** Raw row from the uploaded spreadsheet. Keys are column headers. */
export type SpreadsheetRow = Record<string, string | number>;

/** Resolved product after column mapping. */
export interface Product {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  precoUnitario: number;
  estoque: number;
  /** All other raw columns kept for display */
  extra: Record<string, string | number>;
}

// ─── Column mapping ────────────────────────────────────────────────────────────

/**
 * Maps which spreadsheet column corresponds to each required product field.
 * All values are header names from the uploaded file.
 */
export interface ColumnMapping {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  precoUnitario: string;
  estoque: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  product: Product;
  quantidade: number;
  subtotal: number;
}

export interface Order {
  numero: string;
  data: string;
  hora: string;
  cliente: ClientInfo;
  itens: OrderItem[];
  total: number;
  observacoes?: string;
  condicaoPagamento: string;
  prazoEntrega: string;
  vendedor: string;
}

export interface ClientInfo {
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
}

// ─── SMTP / Email ─────────────────────────────────────────────────────────────

export interface SmtpConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  toEmail: string;
  fromName: string;
}
