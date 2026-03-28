// ─── Spreadsheet ─────────────────────────────────────────────────────────────

/** Raw row from the uploaded spreadsheet. Keys are column headers. */
export type SpreadsheetRow = Record<string, string | number>;

/**
 * Maps which spreadsheet column corresponds to each required order field.
 * Values are the actual header names from the uploaded file.
 */
export interface FieldMapping {
  idCol: string;       // column used as unique product key
  nomeCol: string;     // column used as product name in cart / order
  precoCol: string;    // column used for unit price (subtotal calculation)
  estoqueCol: string;  // column used for stock validation
}

/** Full catalog state — persisted in sessionStorage between page reloads. */
export interface CatalogState {
  fileName: string;
  allHeaders: string[];     // every header from the raw file
  activeColumns: string[];  // vendor-selected subset to display
  rows: SpreadsheetRow[];
  fieldMapping: FieldMapping;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  row: SpreadsheetRow;
  quantidade: number;
  unitPrice: number;
  discount: DiscountConfig;
  grossTotal: number;
  discountTotal: number;
  subtotal: number;
}

export interface Order {
  numero: string;
  data: string;
  hora: string;
  cliente: ClientInfo;
  itens: OrderItem[];
  grossTotal: number;
  itemsSubtotal: number;
  itemDiscountTotal: number;
  orderDiscount: DiscountConfig;
  orderDiscountTotal: number;
  total: number;
  observacoes?: string;
  condicaoPagamento: string;
  prazoEntrega: string;
  vendedor: string;
  fieldMapping: FieldMapping;
  activeColumns: string[];
}

export interface ClientInfo {
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
}

export type DiscountKind = 'value' | 'percent';

export interface DiscountConfig {
  kind: DiscountKind;
  amount: number;
}

// ─── SMTP / Email ─────────────────────────────────────────────────────────────

export interface SmtpConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  toEmail: string;
  fromName: string;
}

// ─── Branding ───────────────────────────────────────────────────────────────

export interface BrandingConfig {
  companyName: string;
  logoPath: string;
  logoAlt: string;
}
