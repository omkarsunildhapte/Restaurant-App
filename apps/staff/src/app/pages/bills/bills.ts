import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { db } from '@app/core/supabase.client';
import { SessionStore } from '@app/core/session.store';
import { FloorStore } from '@app/core/floor.store';
import { DayStore } from '@app/core/day.store';
import { Outbox } from '@app/core/outbox';
import { Printer } from '@app/core/printer';
import { money, round2, type Bill, type Order, type OrderItem, type Payment } from '@app/core/models';

interface Row extends Bill {
  void_reason: string | null;
  orders: Pick<Order, 'order_no' | 'type' | 'table_id' | 'customer_name' | 'customer_phone'> | null;
  bill_payments: Payment[];
}

/**
 * Bills made at this outlet: find one, print it again, or void it (manager and above; the
 * database refuses everyone else). A voided bill frees its items, and "Bill again" opens the
 * order at the counter to issue the corrected bill.
 */
@Component({
  selector: 'app-bills',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl space-y-3 p-3 sm:p-4">
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="mr-auto text-lg font-semibold text-ink-900">Bills</h1>
        <input type="search" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Bill no., table, customer, phone" aria-label="Search bills" class="field mt-0 w-64 py-2" />
        <div class="flex rounded-lg border border-ink-200 p-0.5">
          @for (s of scopes; track s.id) {
            <button type="button" (click)="scope.set(s.id); load()" class="rounded-md px-3 py-1 text-sm" [class]="scope() === s.id ? 'bg-ink-900 text-white' : 'text-ink-600'">{{ s.label }}</button>
          }
        </div>
      </div>
      @if (error()) { <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{{ error() }}</p> }
      @if (notice()) { <p class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">{{ notice() }}</p> }

      <ul class="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200 bg-white">
        @for (b of shown(); track b.id) {
          <li>
            <button type="button" (click)="open(b)" class="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-ink-50">
              <span class="w-32 font-mono text-xs text-ink-600">{{ b.invoice_no }}</span>
              <span class="min-w-0 flex-1 truncate text-sm text-ink-900">{{ where(b) }}</span>
              <span class="text-xs text-ink-500">{{ time(b.paid_at) }}</span>
              <span class="w-20 text-right text-sm font-semibold tabular-nums" [class]="b.is_void ? 'text-ink-400 line-through' : 'text-ink-900'">{{ money(b.total) }}</span>
              <span class="w-14 text-right text-xs uppercase" [class]="b.is_void ? 'text-rose-600' : 'text-ink-500'">{{ b.is_void ? 'void' : b.payment_mode }}</span>
            </button>
          </li>
        } @empty {
          <li class="px-3 py-10 text-center text-sm text-ink-400">{{ loading() ? 'Loading…' : 'No bills yet.' }}</li>
        }
      </ul>
    </div>

    @if (detail(); as d) {
      <div class="fixed inset-0 z-40 grid place-items-end bg-ink-900/50 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="bill-title">
        <div class="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-md sm:rounded-2xl">
          <h2 id="bill-title" class="text-lg font-semibold text-ink-900">{{ d.bill.invoice_no }}</h2>
          <p class="text-sm text-ink-500">{{ where(d.bill) }} · {{ time(d.bill.paid_at) }}</p>
          @if (d.bill.is_void) { <p class="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">Void: {{ d.bill.void_reason }}</p> }
          <ul class="mt-3 space-y-1 text-sm">
            @for (i of d.items; track i.id) {
              <li class="flex justify-between gap-2"><span>{{ i.quantity }} × {{ i.name }}{{ i.variant_name ? ' (' + i.variant_name + ')' : '' }}</span><span class="tabular-nums">{{ money(i.line_total) }}</span></li>
            }
          </ul>
          <dl class="mt-3 space-y-0.5 border-t border-ink-100 pt-2 text-sm">
            @if (d.bill.discount) { <div class="flex justify-between"><dt class="text-ink-500">Discount</dt><dd>−{{ money(d.bill.discount) }}</dd></div> }
            <div class="flex justify-between"><dt class="text-ink-500">CGST + SGST</dt><dd>{{ money(d.bill.cgst + d.bill.sgst) }}</dd></div>
            @if (d.bill.round_off) { <div class="flex justify-between"><dt class="text-ink-500">Round-off</dt><dd>{{ money(d.bill.round_off) }}</dd></div> }
            <div class="flex justify-between font-semibold"><dt>Total</dt><dd>{{ money(d.bill.total) }}</dd></div>
            @for (p of d.bill.bill_payments; track $index) {
              <div class="flex justify-between text-ink-500"><dt>Paid · {{ p.method.toUpperCase() }}</dt><dd>{{ money(p.amount) }}</dd></div>
            }
          </dl>

          @if (voiding()) {
            <label for="void-reason" class="field-label mt-4">Why void this bill?</label>
            <input id="void-reason" [ngModel]="reason()" (ngModelChange)="reason.set($event)" placeholder="Wrong item billed, customer returned…" class="field" />
            <div class="mt-3 flex gap-2">
              <button type="button" (click)="voiding.set(false)" class="btn-secondary flex-1">Keep bill</button>
              <button type="button" (click)="voidBill(d.bill)" [disabled]="!reason().trim() || busy()" class="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Void bill</button>
            </div>
          } @else {
            <div class="mt-5 grid grid-cols-2 gap-2">
              <button type="button" (click)="reprint(d)" class="btn-secondary py-2.5">Print again</button>
              @if (!d.bill.is_void && canVoid()) {
                <button type="button" (click)="voiding.set(true)" class="rounded-lg border border-rose-200 px-3 py-2.5 text-sm font-medium text-rose-700">Void…</button>
              } @else if (d.bill.is_void && d.unbilled) {
                <button type="button" (click)="billAgain(d.bill)" class="btn-primary py-2.5">Bill again</button>
              } @else {
                <span></span>
              }
              <button type="button" (click)="detail.set(null)" class="btn-secondary col-span-2 py-2.5">Close</button>
            </div>
            @if (!d.bill.is_void && !canVoid()) { <p class="mt-2 text-xs text-ink-500">Only a manager can void a bill.</p> }
          }
        </div>
      </div>
    }
  `,
})
export class Bills implements OnInit {
  private readonly session = inject(SessionStore);
  private readonly floor = inject(FloorStore);
  private readonly day = inject(DayStore);
  private readonly outbox = inject(Outbox);
  private readonly printer = inject(Printer);
  private readonly router = inject(Router);
  protected readonly money = money;

  protected readonly scopes = [
    { id: 'day', label: 'Today' },
    { id: 'recent', label: 'Last 200' },
  ] as const;
  protected readonly scope = signal<'day' | 'recent'>('day');
  protected readonly query = signal('');
  protected readonly rows = signal<Row[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly detail = signal<{ bill: Row; items: OrderItem[]; unbilled: boolean } | null>(null);
  protected readonly voiding = signal(false);
  protected readonly reason = signal('');
  protected readonly canVoid = computed(() => ['admin', 'owner', 'manager'].includes(this.session.role() ?? ''));

  protected readonly shown = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.rows().filter((b) => !q || [b.invoice_no, this.where(b), b.orders?.customer_phone ?? ''].some((v) => v.toLowerCase().includes(q)));
  });

  public ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    const outlet = this.session.outlet();
    if (!outlet) return;
    this.loading.set(true);
    this.error.set(null);
    let q = db()
      .from('bills')
      .select('id, order_id, bill_no, invoice_no, subtotal, discount, taxable_amount, cgst, sgst, round_off, total, payment_mode, paid_at, is_void, void_reason, orders(order_no, type, table_id, customer_name, customer_phone), bill_payments(method, amount, reference)')
      .eq('outlet_id', outlet.id)
      .order('paid_at', { ascending: false })
      .limit(200);
    const dayId = this.day.current()?.id;
    if (this.scope() === 'day' && dayId) q = q.eq('day_session_id', dayId);
    const { data, error } = await q;
    this.loading.set(false);
    if (error) this.error.set(this.outbox.online() ? error.message : 'Bills need the internet.');
    else this.rows.set((data ?? []) as unknown as Row[]);
  }

  protected where(b: Row): string {
    const o = b.orders;
    if (!o) return 'Order';
    const base = o.type === 'dine_in' ? 'Table ' + (this.floor.tableName(o.table_id) ?? '') : o.type === 'takeaway' ? 'Takeaway' : 'Delivery';
    return `#${o.order_no} · ${base}${o.customer_name ? ' · ' + o.customer_name : ''}`;
  }

  protected time(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  protected async open(b: Row): Promise<void> {
    this.voiding.set(false);
    this.reason.set('');
    this.notice.set(null);
    const { data } = await db()
      .from('order_items')
      .select('id, order_id, item_id, name, variant_name, addons, quantity, unit_price, tax_rate, line_total, notes, kot_id, bill_id, created_at')
      .eq('order_id', b.order_id)
      .order('created_at');
    const all = (data ?? []) as OrderItem[];
    // A live bill shows its own items; a void one shows what it had (those items are free now).
    const items = b.is_void ? all.filter((i) => !i.bill_id) : all.filter((i) => i.bill_id === b.id);
    this.detail.set({ bill: b, items, unbilled: all.some((i) => !i.bill_id) });
  }

  protected reprint(d: { bill: Row; items: OrderItem[] }): void {
    const o = d.bill.orders;
    const order = { id: d.bill.order_id, order_no: o?.order_no ?? null, type: o?.type ?? 'takeaway', customer_name: o?.customer_name ?? null, customer_phone: o?.customer_phone ?? null } as Order;
    const tax = round2(d.bill.cgst + d.bill.sgst);
    this.printer.receipt(order, d.items, d.bill, d.bill.bill_payments, { subtotal: d.bill.subtotal, discount: d.bill.discount, tax, total: d.bill.total }, this.floor.tableName(o?.table_id ?? null));
  }

  protected async voidBill(b: Row): Promise<void> {
    this.busy.set(true);
    try {
      await this.outbox.send({ kind: 'update', table: 'bills', id: b.id, patch: { is_void: true, void_reason: this.reason().trim() } }, `Void ${b.invoice_no}`);
      this.notice.set(`${b.invoice_no} is void. Its items can be billed again.`);
      this.detail.set(null);
      await this.load();
      void this.day.loadLive();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }

  protected async billAgain(b: Row): Promise<void> {
    if (await this.floor.loadOrder(b.order_id)) {
      void this.router.navigate(['/pos'], { queryParams: { order: b.order_id } });
    } else {
      this.error.set('Could not open that order. Check the internet and try again.');
    }
  }
}
