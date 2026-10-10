import { Injectable, inject } from '@angular/core';
import { BusinessDb, unwrap, type Tables } from './db';

export type OrderStatus = Tables<'orders'>['status'];
export type OrderType = Tables<'orders'>['type'];

export interface OrderRow {
  id: string;
  outlet_id: string;
  order_no: number;
  type: OrderType;
  status: OrderStatus;
  total: number;
  created_at: string;
  customer_name: string | null;
  dining_tables: { name: string } | null;
  bills: { invoice_no: string; is_void: boolean; payment_mode: string }[];
}

export interface OrderDetail extends Tables<'orders'> {
  dining_tables: { name: string } | null;
  order_items: Pick<Tables<'order_items'>, 'id' | 'name' | 'variant_name' | 'addons' | 'quantity' | 'unit_price' | 'tax_rate' | 'line_total' | 'notes'>[];
  bills: (Pick<Tables<'bills'>, 'id' | 'invoice_no' | 'subtotal' | 'discount' | 'cgst' | 'sgst' | 'total' | 'payment_mode' | 'paid_at' | 'is_void' | 'void_reason'> & {
    bill_payments: Pick<Tables<'bill_payments'>, 'method' | 'amount' | 'reference'>[];
  })[];
}

export interface OrderFilter {
  from: string; // yyyy-mm-dd, local
  to: string;
  outletId: string | null;
  status: OrderStatus | '';
}

const PAGE = 200;

/** Read-only order history for owners and managers. Live orders are handled in the staff app. */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly db = inject(BusinessDb);

  async list(tenant: string, f: OrderFilter): Promise<OrderRow[]> {
    const from = new Date(f.from + 'T00:00:00');
    const to = new Date(f.to + 'T00:00:00');
    to.setDate(to.getDate() + 1);
    let q = this.db.client
      .from('orders')
      .select('id, outlet_id, order_no, type, status, total, created_at, customer_name, dining_tables(name), bills(invoice_no, is_void, payment_mode)')
      .eq('tenant_id', tenant)
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString())
      .order('created_at', { ascending: false })
      .limit(PAGE);
    if (f.outletId) q = q.eq('outlet_id', f.outletId);
    if (f.status) q = q.eq('status', f.status);
    return unwrap(await q) as unknown as OrderRow[];
  }

  async detail(id: string): Promise<OrderDetail> {
    return unwrap(
      await this.db.client
        .from('orders')
        .select(
          '*, dining_tables(name), order_items(id, name, variant_name, addons, quantity, unit_price, tax_rate, line_total, notes), ' +
            'bills(id, invoice_no, subtotal, discount, cgst, sgst, total, payment_mode, paid_at, is_void, void_reason, bill_payments(method, amount, reference))',
        )
        .eq('id', id)
        .single(),
    ) as unknown as OrderDetail;
  }

  /** The most a list shows at once; narrow the dates to see more. */
  readonly pageSize = PAGE;
}
