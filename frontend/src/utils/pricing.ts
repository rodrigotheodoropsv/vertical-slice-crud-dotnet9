import type { DiscountConfig, FieldMapping, OrderItem, SpreadsheetRow } from '../types';
import { getNumber } from './productMapper';

export const DEFAULT_DISCOUNT: DiscountConfig = { kind: 'value', amount: 0 };

export interface OrderSummary {
  grossTotal: number;
  itemsSubtotal: number;
  itemDiscountTotal: number;
  orderDiscountTotal: number;
  total: number;
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
  const grossTotal = Math.max(0, unitPrice) * Math.max(0, quantidade);
  const discountTotal = calculateDiscountValue(grossTotal, discount);
  const subtotal = Math.max(0, grossTotal - discountTotal);

  return {
    unitPrice: Math.max(0, unitPrice),
    quantidade: Math.max(0, quantidade),
    discount: sanitizeDiscount(discount),
    grossTotal,
    discountTotal,
    subtotal,
  };
}

export function buildOrderItem(
  row: SpreadsheetRow,
  quantidade: number,
  fieldMapping: Pick<FieldMapping, 'precoCol'>,
  discount?: DiscountConfig,
): OrderItem {
  const unitPrice = getNumber(row, fieldMapping.precoCol);
  return {
    row,
    ...calculateOrderItemPricing(unitPrice, quantidade, discount),
  };
}

export function calculateOrderSummary(items: OrderItem[], orderDiscount?: DiscountConfig): OrderSummary {
  const grossTotal = items.reduce((sum, item) => sum + item.grossTotal, 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemDiscountTotal = items.reduce((sum, item) => sum + item.discountTotal, 0);
  const orderDiscountTotal = calculateDiscountValue(itemsSubtotal, orderDiscount);

  return {
    grossTotal,
    itemsSubtotal,
    itemDiscountTotal,
    orderDiscountTotal,
    total: Math.max(0, itemsSubtotal - orderDiscountTotal),
  };
}

export function hasDiscount(discount?: DiscountConfig): boolean {
  const safe = sanitizeDiscount(discount);
  return safe.amount > 0;
}

export function formatDiscountLabel(discount?: DiscountConfig): string {
  const safe = sanitizeDiscount(discount);
  if (safe.amount <= 0) return 'Sem desconto';
  return safe.kind === 'percent' ? `${safe.amount}%` : `R$ ${safe.amount.toFixed(2)}`;
}