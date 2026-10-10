import { round2 } from '@app/core/models';

/**
 * GST maths, exactly as the database does it (supabase/migrations: before_order_item_write and
 * before_bill_insert). The POS uses it to show the bill before the server has seen the order,
 * and so a bill settled offline adds up to the same total the server will compute on sync;
 * settle_bill refuses payments that don't match the server's total to the paisa.
 */

export interface Line {
  unitPrice: number;
  quantity: number;
  /** Total GST % for the line (e.g. 5). */
  taxRate: number;
}

export interface LineAmounts {
  subtotal: number;
  tax: number;
  total: number;
}

/** One order line. `inclusive`: menu prices already include GST (tenant setting). */
export function lineAmounts(line: Line, inclusive: boolean): LineAmounts {
  const gross = line.unitPrice * line.quantity;
  if (inclusive) {
    const total = round2(gross);
    const subtotal = round2((gross * 100) / (100 + line.taxRate));
    return { subtotal, tax: round2(total - subtotal), total };
  }
  const subtotal = round2(gross);
  const tax = round2((gross * line.taxRate) / 100);
  return { subtotal, tax, total: round2(subtotal + tax) };
}

export interface BillAmounts {
  subtotal: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  /** ± paise to reach a whole rupee (0 when the business has round-off off). */
  roundOff: number;
  total: number;
}

/**
 * The bill for an order: the discount comes off the pre-tax amount and GST shrinks with it.
 * `roundOff`: the business rounds bills to the nearest rupee (supabase 0011). GST stays on the
 * exact taxable amount; only the difference (|x| < 1) is added, like Postgres round() (half up).
 */
export function billAmounts(lines: LineAmounts[], discount: number, roundOff = false): BillAmounts {
  const subtotal = round2(lines.reduce((s, l) => s + l.subtotal, 0));
  const taxTotal = round2(lines.reduce((s, l) => s + l.tax, 0));
  const d = round2(Math.min(Math.max(discount, 0), subtotal));
  const taxable = round2(subtotal - d);
  const tax = subtotal === 0 ? 0 : round2((taxTotal * taxable) / subtotal);
  const cgst = round2(tax / 2);
  const sgst = round2(tax - cgst);
  const exact = round2(taxable + tax);
  // Bill totals are never negative, so Math.round (half up) matches Postgres round(); toPrecision
  // drops float noise first (535.5 must round to 536, not 535).
  const off = roundOff ? round2(Math.round(Number(exact.toPrecision(15))) - exact) : 0;
  return { subtotal, discount: d, taxable, cgst, sgst, roundOff: off, total: round2(exact + off) };
}

/** Splits an amount into `parts` payments that add up exactly (the last one takes the paise left). */
export function splitEqually(total: number, parts: number): number[] {
  const n = Math.max(1, Math.floor(parts));
  const each = Math.floor((total * 100) / n) / 100;
  const out = Array.from({ length: n }, () => each);
  out[n - 1] = round2(total - each * (n - 1));
  return out;
}

/** Discount from a percentage of the pre-tax subtotal, rounded to the paisa. */
export function percentDiscount(subtotal: number, percent: number): number {
  return round2((subtotal * Math.min(Math.max(percent, 0), 100)) / 100);
}
