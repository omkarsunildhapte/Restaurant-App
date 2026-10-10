import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { db, supabase } from '@app/core/supabase.client';
import { SessionStore } from '@app/core/session.store';
import { Outbox } from '@app/core/outbox';
import { MenuStore } from '@app/core/menu.store';
import { billAmounts, lineAmounts, type BillAmounts } from '@app/core/billing';
import { round2, type Bill, type Kot, type MenuItem, type Order, type OrderItem, type OrderType, type Payment, type TableStatus, type Variant } from '@app/core/models';

interface Snapshot {
  orders: Order[];
  items: OrderItem[];
  kots: Kot[];
  tables: TableStatus[];
}

/** Name of the packaging line on takeaway orders (shown on the bill as is). */
export const PACKAGING = 'Packaging';

const OPEN: Order['status'][] = ['new', 'preparing', 'ready'];
const cacheKey = (outlet: string) => 'rp-staff.floor.' + outlet;

export interface NewItem {
  item: MenuItem;
  variant: Variant | null;
  addons: { name: string; price: number }[];
  quantity: number;
  notes: string | null;
}

/**
 * Everything live on the floor of the current outlet: open orders, their items, kitchen
 * tickets (KOT rounds) and table status. Supabase Realtime pushes changes from other devices
 * (waiter phone → kitchen screen → counter), and the store reloads the outlet's open state.
 *
 * Offline: the last state stays on the device, and new orders, items and KOTs are applied
 * here at once and queued in the Outbox until the connection is back.
 */
@Injectable({ providedIn: 'root' })
export class FloorStore implements OnDestroy {
  private readonly session = inject(SessionStore);
  private readonly outbox = inject(Outbox);
  private readonly menu = inject(MenuStore);

  private readonly _snap = signal<Snapshot>({ orders: [], items: [], kots: [], tables: [] });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private channel: RealtimeChannel | null = null;
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;
  /** Finished orders loaded back for billing; kept through reloads until billed or cancelled. */
  private readonly pinned = new Set<string>();

  readonly orders = computed(() => this._snap().orders);
  readonly tables = computed(() => [...this._snap().tables].sort((a, b) => a.sort_order - b.sort_order));
  readonly kots = computed(() => this._snap().kots);
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  public start(): void {
    const outlet = this.session.outlet();
    if (!outlet || this.channel || !supabase) return;
    this.restore(outlet.id);
    void this.reload();
    this.channel = supabase
      .channel('floor-' + outlet.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'outlet_id=eq.' + outlet.id }, () => this.soon())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kots', filter: 'outlet_id=eq.' + outlet.id }, () => this.soon())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: 'tenant_id=eq.' + outlet.tenant_id }, () => this.soon())
      .subscribe();
  }

  public ngOnDestroy(): void {
    void this.channel?.unsubscribe();
  }

  /** Several changes arrive together (an order and its items): reload once. */
  private soon(): void {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => void this.reload(), 250);
  }

  public async reload(): Promise<void> {
    const outlet = this.session.outlet();
    if (!outlet) return;
    // Local changes still queued would be overwritten by the server's older view: wait for them.
    if (this.outbox.pendingCount() > 0) {
      await this.outbox.flush();
      if (this.outbox.pendingCount() > 0) return;
    }
    this._loading.set(true);
    try {
      const c = db();
      const orders = await c
        .from('orders')
        .select('id, tenant_id, outlet_id, order_no, type, status, table_id, customer_name, customer_phone, notes, subtotal, tax_total, total, bill_requested_at, created_at')
        .eq('outlet_id', outlet.id)
        // Open orders, plus finished ones brought back for billing again (loadOrder).
        .or(this.pinned.size ? `status.in.(${OPEN.join(',')}),id.in.(${[...this.pinned].join(',')})` : `status.in.(${OPEN.join(',')})`)
        .order('created_at');
      if (orders.error) throw new Error(orders.error.message);
      const ids = (orders.data ?? []).map((o) => o.id);
      const [items, kots, tables] = await Promise.all([
        ids.length
          ? c.from('order_items').select('id, order_id, item_id, name, variant_name, addons, quantity, unit_price, tax_rate, line_total, notes, kot_id, bill_id, created_at').in('order_id', ids).order('created_at')
          : Promise.resolve({ data: [], error: null }),
        ids.length
          ? c.from('kots').select('id, order_id, outlet_id, round_no, status, created_at, status_changed_at').in('order_id', ids).order('created_at')
          : Promise.resolve({ data: [], error: null }),
        c.from('table_status').select('table_id, name, seats, area, sort_order, order_id, order_no, total, opened_at, bill_requested_at, status').eq('outlet_id', outlet.id),
      ]);
      const failed = [items, kots, tables].find((r) => r.error);
      if (failed?.error) throw new Error(failed.error.message);
      this.set({
        orders: (orders.data ?? []) as Order[],
        items: (items.data ?? []) as OrderItem[],
        kots: (kots.data ?? []) as Kot[],
        tables: (tables.data ?? []) as TableStatus[],
      });
      this._error.set(null);
    } catch (e) {
      this._error.set(this.outbox.online() ? (e as Error).message : null);
    } finally {
      this._loading.set(false);
    }
  }

  // ---- Reading ------------------------------------------------------------------------------

  public order(id: string): Order | undefined {
    return this._snap().orders.find((o) => o.id === id);
  }

  public itemsOf(orderId: string): OrderItem[] {
    return this._snap().items.filter((i) => i.order_id === orderId);
  }

  /** Items not paid yet (an order paid item by item keeps the rest open). */
  public unbilledOf(orderId: string): OrderItem[] {
    return this.itemsOf(orderId).filter((i) => !i.bill_id);
  }

  public kotsOf(orderId: string): Kot[] {
    return this._snap().kots.filter((k) => k.order_id === orderId).sort((a, b) => a.round_no - b.round_no);
  }

  public openOrderForTable(tableId: string): Order | undefined {
    return this._snap().orders.find((o) => o.table_id === tableId && o.type === 'dine_in');
  }

  public tableName(tableId: string | null): string | null {
    return tableId ? (this._snap().tables.find((t) => t.table_id === tableId)?.name ?? null) : null;
  }

  // ---- Writing (through the Outbox, applied here at once) -----------------------------------

  public async createOrder(type: OrderType, opts: { tableId?: string | null; customerName?: string | null; customerPhone?: string | null } = {}): Promise<Order> {
    const outlet = this.session.outlet()!;
    const order: Order = {
      id: crypto.randomUUID(),
      tenant_id: outlet.tenant_id,
      outlet_id: outlet.id,
      order_no: null,
      type,
      status: 'new',
      table_id: opts.tableId ?? null,
      customer_name: opts.customerName?.trim() || null,
      customer_phone: opts.customerPhone?.trim() || null,
      notes: null,
      subtotal: 0,
      tax_total: 0,
      total: 0,
      bill_requested_at: null,
      created_at: new Date().toISOString(),
    };
    this.patch((s) => ({
      ...s,
      orders: [...s.orders, order],
      tables: s.tables.map((t) => (t.table_id === order.table_id ? { ...t, status: 'occupied', order_id: order.id } : t)),
    }));
    const saved = await this.outbox.send<Order>(
      {
        kind: 'insert',
        table: 'orders',
        row: { id: order.id, tenant_id: order.tenant_id, outlet_id: order.outlet_id, type, table_id: order.table_id, customer_name: order.customer_name, customer_phone: order.customer_phone },
      },
      `New ${type.replace('_', '-')} order`,
    );
    if (saved) this.patch((s) => ({ ...s, orders: s.orders.map((o) => (o.id === order.id ? { ...o, order_no: saved.order_no } : o)) }));
    // Takeaway packing, when the business charges for it (owner's setting, supabase 0011).
    const packaging = this.menu.menu().packagingCharge;
    if (type === 'takeaway' && packaging > 0) await this.addCustomLine(order.id, PACKAGING, packaging, this.menu.menu().defaultTaxRate);
    return order;
  }

  /**
   * A line that is not a menu dish (packaging). The kitchen screen and KOT slips skip these
   * (item_id is null); GST is the business's default rate, as packing follows the food's rate.
   */
  public async addCustomLine(orderId: string, name: string, price: number, taxRate: number): Promise<void> {
    const order = this.order(orderId);
    if (!order) return;
    const amounts = lineAmounts({ unitPrice: price, quantity: 1, taxRate }, this.menu.menu().pricesIncludeTax);
    const line: OrderItem = {
      id: crypto.randomUUID(), order_id: orderId, item_id: null, name, variant_name: null, addons: [], quantity: 1,
      unit_price: price, tax_rate: taxRate, line_total: amounts.total, notes: null, kot_id: null, bill_id: null,
      created_at: new Date().toISOString(),
    };
    this.patch((s) => ({ ...s, items: [...s.items, line] }));
    this.retotal(orderId);
    await this.outbox.send(
      { kind: 'insert', table: 'order_items', row: { id: line.id, tenant_id: order.tenant_id, order_id: orderId, name, quantity: 1, unit_price: price, tax_rate: taxRate } },
      name,
    );
  }

  /** Guests move to another (free) table. */
  public async moveTable(orderId: string, tableId: string): Promise<void> {
    const from = this.order(orderId)?.table_id ?? null;
    this.patch((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, table_id: tableId } : o)),
      tables: s.tables.map((t) =>
        t.table_id === from ? { ...t, status: 'free', order_id: null, order_no: null, total: null, bill_requested_at: null }
        : t.table_id === tableId ? { ...t, status: 'occupied', order_id: orderId } : t,
      ),
    }));
    await this.outbox.send({ kind: 'update', table: 'orders', id: orderId, patch: { table_id: tableId } }, `Moved to ${this.tableName(tableId) ?? 'table'}`);
  }

  /** Two tables become one bill: everything on `fromId` moves to `intoId` (supabase merge_orders). */
  public async mergeInto(fromId: string, intoId: string): Promise<void> {
    this.patch((s) => ({
      ...s,
      items: s.items.map((i) => (i.order_id === fromId ? { ...i, order_id: intoId } : i)),
      kots: s.kots.map((k) => (k.order_id === fromId ? { ...k, order_id: intoId } : k)),
    }));
    this.dropOrder(fromId);
    this.retotal(intoId);
    await this.outbox.send({ kind: 'rpc', fn: 'merge_orders', args: { p_from: fromId, p_into: intoId } }, 'Tables merged');
    this.soon();
  }

  /** Name and phone on the bill (repeat customers, phone orders). */
  public async setCustomer(orderId: string, name: string | null, phone: string | null): Promise<void> {
    const patch = { customer_name: name?.trim() || null, customer_phone: phone?.trim() || null };
    const o = this.order(orderId);
    if (!o || (o.customer_name === patch.customer_name && o.customer_phone === patch.customer_phone)) return;
    this.patch((s) => ({ ...s, orders: s.orders.map((x) => (x.id === orderId ? { ...x, ...patch } : x)) }));
    await this.outbox.send({ kind: 'update', table: 'orders', id: orderId, patch }, 'Customer details');
  }

  /**
   * Puts any order (also a finished one) on the floor so the POS can bill it: used after a bill
   * is voided, when its items are free to be billed again.
   */
  public async loadOrder(orderId: string): Promise<boolean> {
    const c = db();
    const [o, items, kots] = await Promise.all([
      c.from('orders').select('id, tenant_id, outlet_id, order_no, type, status, table_id, customer_name, customer_phone, notes, subtotal, tax_total, total, bill_requested_at, created_at').eq('id', orderId).single(),
      c.from('order_items').select('id, order_id, item_id, name, variant_name, addons, quantity, unit_price, tax_rate, line_total, notes, kot_id, bill_id, created_at').eq('order_id', orderId).order('created_at'),
      c.from('kots').select('id, order_id, outlet_id, round_no, status, created_at, status_changed_at').eq('order_id', orderId),
    ]);
    if (o.error || items.error || kots.error) return false;
    this.pinned.add(orderId);
    this.patch((s) => ({
      ...s,
      orders: [...s.orders.filter((x) => x.id !== orderId), o.data as Order],
      items: [...s.items.filter((x) => x.order_id !== orderId), ...((items.data ?? []) as OrderItem[])],
      kots: [...s.kots.filter((x) => x.order_id !== orderId), ...((kots.data ?? []) as Kot[])],
    }));
    return true;
  }

  public async addItem(orderId: string, n: NewItem): Promise<void> {
    const order = this.order(orderId)!;
    // The same dish again (same size, add-ons and note, not yet sent): one line with a higher quantity.
    const same = this.itemsOf(orderId).find(
      (i) =>
        !i.kot_id &&
        !i.bill_id &&
        i.item_id === n.item.id &&
        i.variant_name === (n.variant?.name ?? null) &&
        (i.notes ?? null) === (n.notes ?? null) &&
        JSON.stringify(i.addons) === JSON.stringify(n.addons),
    );
    if (same) {
      await this.setQuantity(same, same.quantity + n.quantity);
      return;
    }
    const unit = round2((n.variant?.price ?? n.item.price) + n.addons.reduce((sum, a) => sum + a.price, 0));
    const taxRate = this.menu.taxRateOf(n.item);
    const amounts = lineAmounts({ unitPrice: unit, quantity: n.quantity, taxRate }, this.menu.menu().pricesIncludeTax);
    const line: OrderItem = {
      id: crypto.randomUUID(),
      order_id: orderId,
      item_id: n.item.id,
      name: n.item.name,
      variant_name: n.variant?.name ?? null,
      addons: n.addons,
      quantity: n.quantity,
      unit_price: unit,
      tax_rate: taxRate,
      line_total: amounts.total,
      notes: n.notes,
      kot_id: null,
      bill_id: null,
      created_at: new Date().toISOString(),
    };
    this.patch((s) => ({ ...s, items: [...s.items, line] }));
    this.retotal(orderId);
    await this.outbox.send(
      {
        kind: 'insert',
        table: 'order_items',
        row: {
          id: line.id, tenant_id: order.tenant_id, order_id: orderId, item_id: n.item.id, name: line.name,
          variant_name: line.variant_name, addons: line.addons, quantity: line.quantity, unit_price: unit, notes: line.notes,
        },
      },
      `${n.quantity} × ${line.name}`,
    );
  }

  /** Changes the quantity of an item not yet sent to the kitchen; 0 removes it. */
  public async setQuantity(item: OrderItem, quantity: number): Promise<void> {
    if (quantity <= 0) {
      this.patch((s) => ({ ...s, items: s.items.filter((i) => i.id !== item.id) }));
      this.retotal(item.order_id);
      await this.outbox.send({ kind: 'delete', table: 'order_items', id: item.id }, `Remove ${item.name}`);
      return;
    }
    this.patch((s) => ({
      ...s,
      items: s.items.map((i) =>
        i.id === item.id
          ? { ...i, quantity, line_total: lineAmounts({ unitPrice: i.unit_price, quantity, taxRate: i.tax_rate }, this.menu.menu().pricesIncludeTax).total }
          : i,
      ),
    }));
    this.retotal(item.order_id);
    await this.outbox.send({ kind: 'update', table: 'order_items', id: item.id, patch: { quantity } }, `${quantity} × ${item.name}`);
  }

  /** Sends every unsent item of the order to the kitchen as the next KOT round. */
  public async sendKot(orderId: string): Promise<void> {
    const unsent = this.itemsOf(orderId).filter((i) => !i.kot_id);
    if (!unsent.length) return;
    const round = Math.max(0, ...this.kotsOf(orderId).map((k) => k.round_no)) + 1;
    const kot: Kot = {
      id: 'local-' + crypto.randomUUID(),
      order_id: orderId,
      outlet_id: this.session.outlet()!.id,
      round_no: round,
      status: 'new',
      created_at: new Date().toISOString(),
      status_changed_at: new Date().toISOString(),
    };
    this.patch((s) => ({
      ...s,
      kots: [...s.kots, kot],
      items: s.items.map((i) => (i.order_id === orderId && !i.kot_id ? { ...i, kot_id: kot.id } : i)),
    }));
    await this.outbox.send({ kind: 'rpc', fn: 'send_kot', args: { p_order: orderId } }, `KOT round ${round}`);
    this.soon();
  }

  public async requestBill(orderId: string): Promise<void> {
    const at = new Date().toISOString();
    this.patch((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, bill_requested_at: at } : o)),
      tables: s.tables.map((t) => (t.order_id === orderId ? { ...t, status: 'bill_requested', bill_requested_at: at } : t)),
    }));
    await this.outbox.send({ kind: 'rpc', fn: 'request_bill', args: { p_order: orderId } }, 'Bill requested');
  }

  /** Kitchen moves a KOT forward (or a cashier cancels it). */
  public async moveKot(kot: Kot, status: Kot['status']): Promise<void> {
    this.patch((s) => ({ ...s, kots: s.kots.map((k) => (k.id === kot.id ? { ...k, status, status_changed_at: new Date().toISOString() } : k)) }));
    // A KOT made offline on this device has no server id yet; it moves once it has synced.
    if (kot.id.startsWith('local-')) return;
    await this.outbox.send({ kind: 'update', table: 'kots', id: kot.id, patch: { status } }, `KOT ${status}`);
  }

  public async cancelOrder(orderId: string): Promise<void> {
    this.dropOrder(orderId);
    await this.outbox.send({ kind: 'update', table: 'orders', id: orderId, patch: { status: 'cancelled' } }, 'Order cancelled');
  }

  /**
   * Bills the order. Online, resolves with the bill (number, GST split) from the server. Offline,
   * the bill is queued and null comes back: the receipt is printed as provisional.
   */
  public async settle(orderId: string, discount: number, payments: Payment[]): Promise<Bill | null> {
    const bill = await this.outbox.send<Bill>(
      { kind: 'rpc', fn: 'settle_bill', args: { p_order: orderId, p_discount: discount, p_payments: payments } },
      'Bill settled',
    );
    this.dropOrder(orderId);
    return bill;
  }

  /**
   * One guest's bill: only the items given. The bill id is made here, so a split bill taken
   * offline is the same bill when it syncs (and a resend returns it instead of billing twice).
   * Resolves with the bill and whether the order is now fully paid (it then leaves the floor).
   */
  public async settleSplit(orderId: string, itemIds: string[], discount: number, payments: Payment[]): Promise<{ bill: Bill | null; finished: boolean }> {
    const billId = crypto.randomUUID();
    const ids = new Set(itemIds);
    this.patch((s) => ({ ...s, items: s.items.map((i) => (ids.has(i.id) ? { ...i, bill_id: billId } : i)) }));
    const finished = this.unbilledOf(orderId).length === 0;
    let bill: Bill | null;
    try {
      bill = await this.outbox.send<Bill>(
        { kind: 'rpc', fn: 'settle_split_bill', args: { p_order: orderId, p_bill_id: billId, p_item_ids: itemIds, p_discount: discount, p_payments: payments } },
        `Split bill (${itemIds.length} item${itemIds.length === 1 ? '' : 's'})`,
      );
    } catch (e) {
      // Refused by the server: the items are unpaid again.
      this.patch((s) => ({ ...s, items: s.items.map((i) => (i.bill_id === billId ? { ...i, bill_id: null } : i)) }));
      throw e;
    }
    const type = this.order(orderId)?.type;
    if (finished && type !== 'delivery') this.dropOrder(orderId);
    return { bill, finished };
  }

  /**
   * Breaks a line in two so part of it can go on another bill (one of two coffees). The new
   * line's id is made here; the database keeps its kitchen round, price and GST rate.
   */
  public async splitItem(item: OrderItem, quantity: number): Promise<OrderItem | null> {
    if (item.bill_id || quantity < 1 || quantity >= item.quantity) return null;
    const inclusive = this.menu.menu().pricesIncludeTax;
    const total = (q: number) => lineAmounts({ unitPrice: item.unit_price, quantity: q, taxRate: item.tax_rate }, inclusive).total;
    const part: OrderItem = { ...item, id: crypto.randomUUID(), quantity, line_total: total(quantity) };
    this.patch((s) => {
      const at = s.items.findIndex((i) => i.id === item.id);
      const items = s.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - quantity, line_total: total(i.quantity - quantity) } : i));
      items.splice(at + 1, 0, part);
      return { ...s, items };
    });
    this.retotal(item.order_id);
    await this.outbox.send(
      { kind: 'rpc', fn: 'split_order_item', args: { p_item: item.id, p_quantity: quantity, p_new_id: part.id } },
      `Split ${quantity} × ${item.name}`,
    );
    return part;
  }

  // ---- Internals -------------------------------------------------------------------------

  private dropOrder(orderId: string): void {
    this.pinned.delete(orderId);
    this.patch((s) => ({
      ...s,
      orders: s.orders.filter((o) => o.id !== orderId),
      items: s.items.filter((i) => i.order_id !== orderId),
      kots: s.kots.filter((k) => k.order_id !== orderId),
      tables: s.tables.map((t) => (t.order_id === orderId ? { ...t, status: 'free', order_id: null, order_no: null, total: null, bill_requested_at: null } : t)),
    }));
  }

  /**
   * The next bill for an order, computed here exactly as the database will (see billing.ts):
   * the items not paid yet, or only `itemIds` of them for a split bill.
   */
  public billFor(orderId: string, discount: number, itemIds?: readonly string[]): BillAmounts {
    const pick = itemIds ? new Set(itemIds) : null;
    return this.amountsOf(this.unbilledOf(orderId).filter((i) => !pick || pick.has(i.id)), discount, this.menu.menu().roundOff);
  }

  /** `roundOff`: bills are rounded (the business setting); order totals in lists are not. */
  private amountsOf(items: OrderItem[], discount: number, roundOff = false): BillAmounts {
    const inclusive = this.menu.menu().pricesIncludeTax;
    return billAmounts(
      items.map((i) => lineAmounts({ unitPrice: i.unit_price, quantity: i.quantity, taxRate: i.tax_rate }, inclusive)),
      discount,
      roundOff,
    );
  }

  /** Keeps the order's total (every item, paid or not) in step until the server's copy arrives. */
  private retotal(orderId: string): void {
    const b = this.amountsOf(this.itemsOf(orderId), 0);
    this.patch((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, subtotal: b.subtotal, tax_total: round2(b.cgst + b.sgst), total: b.total } : o)),
      tables: s.tables.map((t) => (t.order_id === orderId ? { ...t, total: b.total } : t)),
    }));
  }

  private patch(fn: (s: Snapshot) => Snapshot): void {
    this.set(fn(this._snap()));
  }

  private set(snap: Snapshot): void {
    this._snap.set(snap);
    const outlet = this.session.outlet();
    if (!outlet) return;
    try {
      localStorage.setItem(cacheKey(outlet.id), JSON.stringify(snap));
    } catch {
      /* no offline copy */
    }
  }

  private restore(outletId: string): void {
    try {
      const raw = localStorage.getItem(cacheKey(outletId));
      if (raw) this._snap.set(JSON.parse(raw) as Snapshot);
    } catch {
      /* nothing cached */
    }
  }
}
