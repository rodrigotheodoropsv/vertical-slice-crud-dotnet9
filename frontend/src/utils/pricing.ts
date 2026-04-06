import type { DiscountConfig, FieldMapping, OrderItem, SpreadsheetRow } from '../types';
import { getNumber } from './productMapper';

export const DEFAULT_DISCOUNT: DiscountConfig = { kind: 'value', amount: 0 };

export interface OrderSummary {
  grossTotal: number;
  itemsSubtotal: number;
  itemDiscountTotal: number;
  orderDiscountTotal: number;
  total: number;
  totalProdutos: number;
  totalST: number;
  totalComImpostos: number;
}

export function sanitizeDiscount(discount?: DiscountConfig): DiscountConfig {
  const kind = discount?.kind === 'percent' ? 'percent' : 'value';
  const amount = Number.isFinite(discount?.amount) ? Math.max(0, discount!.amount) : 0;
  return { kind, amount };
}

export function calculateDiscountValue(baseAmount: number, discount?: DiscountConfig): number {
  const safeBase = Math.max(0, baseAmount);
  const safeDiscount = sanitizeDiscount(discount);
  if (safeDiscount.amount <= 0 || safeBase <= 0) return 0;

  if (safeDiscount.kind === 'percent') {
    return Math.min(safeBase, (safeBase * safeDiscount.amount) / 100);
  }

  return Math.min(safeBase, safeDiscount.amount);
}

export function calculateOrderItemPricing(unitPrice: number, quantidade: number, discount?: DiscountConfig) {
  const safePrice = Math.max(0, unitPrice);
  const safeQty   = Math.max(0, quantidade);
  const grossTotal = safePrice * safeQty;
  const safeDiscount = sanitizeDiscount(discount);

  // Value discounts are per-unit (R$ X off each unit × qty).
  // Percentage discounts already scale naturally through grossTotal.
  let discountTotal: number;
  if (safeDiscount.kind === 'value') {
    const perUnit = Math.min(safePrice, safeDiscount.amount);
    discountTotal = perUnit * safeQty;
  } else {
    discountTotal = calculateDiscountValue(grossTotal, discount);
  }
  const subtotal = Math.max(0, grossTotal - discountTotal);

  return {
    unitPrice: Math.max(0, unitPrice),
    quantidade: Math.max(0, quantidade),
    discount: sanitizeDiscount(discount),
    grossTotal,
    discountTotal,
    subtotal,
    // IPI and ST fields are computed in buildOrderItem where the row is available;
    // here they stay at 0 since we don't have row context.
    ipiPct: 0,
    ipiValue: 0,
    stPct: 0,
    stValue: 0,
  };
}

export function buildOrderItem(
  row: SpreadsheetRow,
  quantidade: number,
  fieldMapping: Pick<FieldMapping, 'precoCol' | 'ipiCol' | 'stCol'>,
  discount?: DiscountConfig,
): OrderItem {
  const unitPrice = getNumber(row, fieldMapping.precoCol);
  const pricing = calculateOrderItemPricing(unitPrice, quantidade, discount);

  // Parse IPI percentage: stored as '3,25%', '3.25%', '3.25', '0', etc.
  let ipiPct = 0;
  if (fieldMapping.ipiCol) {
    const raw = String(row[fieldMapping.ipiCol] ?? '').replace('%', '').replace(',', '.');
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) ipiPct = parsed;
  }
  const ipiValue = (pricing.subtotal * ipiPct) / 100;

  // Parse ST percentage
  let stPct = 0;
  if (fieldMapping.stCol) {
    const raw = String(row[fieldMapping.stCol] ?? '').replace('%', '').replace(',', '.');
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) stPct = parsed;
  }
  const stValue = ((pricing.subtotal + ipiValue) * stPct) / 100;

  return { row, ...pricing, ipiPct, ipiValue, stPct, stValue };
}

export function calculateOrderSummary(items: OrderItem[], orderDiscount?: DiscountConfig): OrderSummary {
  const grossTotal = items.reduce((sum, item) => sum + item.grossTotal, 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemDiscountTotal = items.reduce((sum, item) => sum + item.discountTotal, 0);
  const orderDiscountTotal = calculateDiscountValue(itemsSubtotal, orderDiscount);
  const total = Math.max(0, itemsSubtotal - orderDiscountTotal);
  const ipiTotal = items.reduce((sum, item) => sum + item.ipiValue, 0);
  const stTotal = items.reduce((sum, item) => sum + item.stValue, 0);

  return {
    grossTotal,
    itemsSubtotal,
    itemDiscountTotal,
    orderDiscountTotal,
    total,
    totalProdutos: total,
    totalST: stTotal,
    totalComImpostos: total + ipiTotal + stTotal,
  };
}

export function hasDiscount(discount?: DiscountConfig): boolean {
  const safe = sanitizeDiscount(discount);
  return safe.amount > 0;
}

export function formatDiscountLabel(discount?: DiscountConfig): string {
  const safe = sanitizeDiscount(discount);
  if (safe.amount <= 0) return 'Sem desconto';
  return safe.kind === 'percent' ? `${safe.amount}%` : `R$ ${safe.amount.toFixed(2)}/un`;
}