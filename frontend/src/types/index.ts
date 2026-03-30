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
  ipiCol: string;      // column for IPI tax percentage (may be '')
  grupoCol: string;    // column for product group code (may be '')
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
  ipiPct: number;    // IPI percentage (0 when not applicable)
  ipiValue: number;  // IPI monetary value for this item (subtotal * ipiPct / 100)
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
  total: number;             // total after item + order discounts (sem IPI)
  totalProdutos: number;     // same as total (alias used on PDF)
  totalComImpostos: number;  // total + sum of all item IPI values
  observacoes?: string;
  frete?: string;
  validadeOrcamento?: string;
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
  bairro?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  inscricaoEstadual?: string;
  codCliente?: string;
  comprador?: string;
}

export type DiscountKind = 'value' | 'percent';

export interface DiscountConfig {
  kind: DiscountKind;
  amount: number;
}

// ─── SMTP / Email ─────────────────────────────────────────────────────────────

export interface SmtpConfig {
  /** E-mail padrão do departamento de vendas (destino padrão do envio) */
  salesEmail: string;
  /** Nome exibido no campo "De:" */
  fromName: string;
  /** Cargo do remetente para assinatura */
  fromCargo: string;
  /** Celular do remetente para assinatura */
  fromCelular: string;
}

// ─── Branding ───────────────────────────────────────────────────────────────

export interface BrandingConfig {
  companyName: string;
  logoPath: string;
  logoAlt: string;
}
