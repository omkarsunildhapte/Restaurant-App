import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FloorStore } from '@app/core/floor.store';
import { DayStore } from '@app/core/day.store';
import { Printer } from '@app/core/printer';
import { Outbox } from '@app/core/outbox';
import { percentDiscount, splitEqually } from '@app/core/billing';
import { money, round2, type OrderItem, type PaymentMode } from '@app/core/models';

interface Row {
  method: PaymentMode;
  amount: number;
  reference: string;
}

const METHODS: { id: PaymentMode; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
];

/**
 * Billing an order: discount, one or more payments that must add up to the bill exactly
 * (split between guests or between cash, UPI and card), change for cash, then settle and
 * print the GST receipt. The amounts are worked out here exactly as the database will.
 *
 * "By items" bills one guest at a time: tick their items (a line of 2 can be split to put one
 * on this bill), settle and print, and the rest stays open for the next guest.
 */
@Component({
  selector: 'app-checkout',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = bill();
    <div class="space-y-3 p-3">
      @if (!day.current()) {
        <p class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Open the day before billing. <a routerLink="/day" class="font-semibold underline">Open day</a></p>
      }
      @if (notice()) { <p class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">{{ notice() }}</p> }

      <div class="flex rounded-lg border border-ink-200 p-0.5" role="group" aria-label="What to bill">
        <button type="button" (click)="setByItems(false)" class="flex-1 rounded-md px-2.5 py-1.5 text-sm" [class]="!byItems() ? 'bg-ink-900 text-white' : 'text-ink-600'">
          {{ paidCount() ? 'Rest of the order' : 'Whole order' }}
        </button>
        <button type="button" (click)="setByItems(true)" [disabled]="unbilled().length < 2 && !hasMultiple()" class="flex-1 rounded-md px-2.5 py-1.5 text-sm disabled:opacity-40" [class]="byItems() ? 'bg-ink-900 text-white' : 'text-ink-600'">By items</button>
      </div>

      @if (byItems()) {
        <ul class="divide-y divide-ink-100 rounded-lg border border-ink-200" aria-label="Items on this bill">
          @for (i of unbilled(); track i.id) {
            <li class="flex items-center gap-2 px-2.5 py-2">
              <input type="checkbox" [id]="'pick-' + i.id" [checked]="picked().has(i.id)" (change)="toggle(i.id)" class="size-5 accent-brand-600" />
              <label [for]="'pick-' + i.id" class="min-w-0 flex-1 text-sm text-ink-800">{{ i.quantity }} × {{ label(i) }}</label>
              @if (i.quantity > 1) {
                <button type="button" (click)="splitOne(i)" [disabled]="busy()" class="chip text-xs" [attr.aria-label]="'Split one ' + i.name + ' onto its own line'">Split 1</button>
              }
              <span class="w-16 text-right text-sm tabular-nums text-ink-700">{{ money(i.line_total) }}</span>
            </li>
          }
        </ul>
        @if (paidCount()) { <p class="text-xs text-ink-500">{{ paidCount() }} item{{ paidCount() === 1 ? '' : 's' }} already paid on earlier bills.</p> }
      }
      <div class="grid grid-cols-2 gap-2">
        <input [ngModel]="custName()" (ngModelChange)="custName.set($event)" placeholder="Customer name (optional)" aria-label="Customer name" autocomplete="off" class="field mt-0 py-1.5" />
        <input [ngModel]="custPhone()" (ngModelChange)="custPhone.set($event)" placeholder="Phone (optional)" aria-label="Customer phone" type="tel" inputmode="tel" autocomplete="off" class="field mt-0 py-1.5" />
      </div>
      <div class="flex items-center gap-2">
        <label for="disc" class="text-sm text-ink-600">Discount</label>
        <input id="disc" type="number" min="0" step="1" [ngModel]="discountValue()" (ngModelChange)="discountValue.set(+$event || 0)" class="field mt-0 w-24 py-1.5" />
        <div class="flex rounded-lg border border-ink-200 p-0.5">
          @for (u of ['₹', '%']; track u) {
            <button type="button" (click)="discountUnit.set($any(u))" class="rounded-md px-2.5 py-1 text-sm" [class]="discountUnit() === u ? 'bg-ink-900 text-white' : 'text-ink-600'">{{ u }}</button>
          }
        </div>
      </div>

      <dl class="space-y-0.5 rounded-lg bg-ink-50 p-3 text-sm">
        <div class="flex justify-between"><dt class="text-ink-500">Subtotal</dt><dd class="tabular-nums">{{ money(b.subtotal) }}</dd></div>
        @if (b.discount) { <div class="flex justify-between"><dt class="text-ink-500">Discount</dt><dd class="tabular-nums">−{{ money(b.discount) }}</dd></div> }
        <div class="flex justify-between"><dt class="text-ink-500">CGST + SGST</dt><dd class="tabular-nums">{{ money(b.cgst + b.sgst) }}</dd></div>
        @if (b.roundOff) { <div class="flex justify-between"><dt class="text-ink-500">Round-off</dt><dd class="tabular-nums">{{ b.roundOff > 0 ? '+' : '−' }}{{ money(abs(b.roundOff)) }}</dd></div> }
        <div class="flex justify-between text-lg font-bold text-ink-900"><dt>Total</dt><dd class="tabular-nums">{{ money(b.total) }}</dd></div>
      </dl>

      <div>
        <p class="text-xs font-semibold uppercase text-ink-500">Payment</p>
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          @for (m of methods; track m.id) {
            <button type="button" (click)="payAll(m.id)" class="chip">All {{ m.label }}</button>
          }
          <button type="button" (click)="split(2)" class="chip">Split 2</button>
          <button type="button" (click)="split(3)" class="chip">Split 3</button>
          <button type="button" (click)="split(4)" class="chip">Split 4</button>
        </div>
        @for (r of rows(); track $index) {
          <div class="mt-2 flex items-center gap-1.5">
            <select [ngModel]="r.method" (ngModelChange)="setRow($index, { method: $event })" [attr.aria-label]="'Payment ' + ($index + 1) + ' method'" class="field mt-0 w-24 py-1.5">
              @for (m of methods; track m.id) { <option [value]="m.id">{{ m.label }}</option> }
            </select>
            <input type="number" min="0" step="0.01" [ngModel]="r.amount" (ngModelChange)="setRow($index, { amount: +$event || 0 })" [attr.aria-label]="'Payment ' + ($index + 1) + ' amount'" class="field mt-0 flex-1 py-1.5 tabular-nums" />
            @if (r.method !== 'cash') {
              <input [ngModel]="r.reference" (ngModelChange)="setRow($index, { reference: $event })" placeholder="Ref" aria-label="Reference" class="field mt-0 w-20 py-1.5" />
            }
            <button type="button" (click)="removeRow($index)" class="px-1 text-ink-400 hover:text-rose-600" aria-label="Remove payment">✕</button>
          </div>
        }
        <button type="button" (click)="addRow()" class="mt-2 text-sm font-medium text-brand-600">+ Add payment</button>
        <p class="mt-2 text-sm" [class]="remaining() === 0 ? 'text-emerald-700' : 'text-rose-600'">
          {{ remaining() === 0 ? 'Payments match the bill' : remaining() > 0 ? money(remaining()) + ' still to pay' : money(-remaining()) + ' more than the bill' }}
        </p>
      </div>

      @if (cashDue() > 0) {
        <div class="flex items-center gap-2 rounded-lg bg-emerald-50 p-2">
          <label for="tendered" class="text-sm text-emerald-900">Cash given</label>
          <input id="tendered" type="number" min="0" step="1" [ngModel]="tendered()" (ngModelChange)="tendered.set(+$event || 0)" class="field mt-0 w-24 py-1.5" />
          <span class="ml-auto text-sm font-semibold text-emerald-900">Change {{ money(change()) }}</span>
        </div>
      }

      @if (error()) { <p class="text-sm text-rose-600" role="alert">{{ error() }}</p> }
      <button type="button" (click)="settle()" [disabled]="!canSettle()" class="btn-primary w-full py-3.5 text-base">
        {{ busy() ? 'Saving…' : 'Settle & print · ' + money(b.total) }}
      </button>
      @if (!outbox.online()) { <p class="text-xs text-amber-700">Offline: the bill is printed as provisional and gets its number when it syncs.</p> }
    </div>
  `,
})
export class Checkout {
  readonly orderId = input.required<string>();
  readonly done = output<void>();

  protected readonly floor = inject(FloorStore);
  protected readonly day = inject(DayStore);
  protected readonly outbox = inject(Outbox);
  private readonly printer = inject(Printer);
  protected readonly money = money;
  protected readonly methods = METHODS;

  protected readonly abs = Math.abs;
  protected readonly custName = signal('');
  protected readonly custPhone = signal('');
  protected readonly discountValue = signal(0);
  protected readonly discountUnit = signal<'₹' | '%'>('₹');
  protected readonly rows = signal<Row[]>([]);
  protected readonly tendered = signal(0);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly byItems = signal(false);
  protected readonly picked = signal<ReadonlySet<string>>(new Set());

  protected readonly unbilled = computed(() => this.floor.unbilledOf(this.orderId()));
  protected readonly hasMultiple = computed(() => this.unbilled().some((i) => i.quantity > 1));
  protected readonly paidCount = computed(() => this.floor.itemsOf(this.orderId()).filter((i) => i.bill_id).length);
  /** Items on the bill being made: the ticked ones, or everything not paid yet. */
  private readonly billIds = computed(() => (this.byItems() ? [...this.picked()].filter((id) => this.unbilled().some((i) => i.id === id)) : undefined));

  private readonly discount = computed(() => {
    const sub = this.floor.billFor(this.orderId(), 0, this.billIds()).subtotal;
    return this.discountUnit() === '%' ? percentDiscount(sub, this.discountValue()) : round2(this.discountValue());
  });
  protected readonly bill = computed(() => this.floor.billFor(this.orderId(), this.discount(), this.billIds()));
  protected readonly paid = computed(() => round2(this.rows().reduce((s, r) => s + r.amount, 0)));
  protected readonly remaining = computed(() => round2(this.bill().total - this.paid()));
  protected readonly cashDue = computed(() => round2(this.rows().filter((r) => r.method === 'cash').reduce((s, r) => s + r.amount, 0)));
  protected readonly change = computed(() => Math.max(0, round2(this.tendered() - this.cashDue())));
  protected readonly canSettle = computed(
    () =>
      !this.busy() && !!this.day.current() && this.bill().total > 0 && this.remaining() === 0 && this.rows().every((r) => r.amount > 0) &&
      (!this.byItems() || (this.billIds()?.length ?? 0) > 0),
  );

  protected setByItems(on: boolean): void {
    this.byItems.set(on);
    this.picked.set(new Set());
    this.rows.set([]);
    this.notice.set(null);
  }

  protected toggle(id: string): void {
    this.picked.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    this.rows.set([]);
  }

  /** Puts one of a line onto its own line and ticks it (one of two coffees for this guest). */
  protected async splitOne(item: OrderItem): Promise<void> {
    this.error.set(null);
    try {
      const part = await this.floor.splitItem(item, 1);
      if (part) {
        this.picked.update((set) => new Set([...set, part.id]));
        this.rows.set([]);
      }
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  protected label(i: OrderItem): string {
    return i.name + (i.variant_name ? ` (${i.variant_name})` : '') + (i.addons.length ? ' + ' + i.addons.map((a) => a.name).join(', ') : '');
  }

  protected payAll(method: PaymentMode): void {
    this.rows.set([{ method, amount: this.bill().total, reference: '' }]);
    this.tendered.set(method === 'cash' ? this.bill().total : 0);
  }

  protected split(parts: number): void {
    const method = this.rows()[0]?.method ?? 'cash';
    this.rows.set(splitEqually(this.bill().total, parts).map((amount) => ({ method, amount, reference: '' })));
  }

  protected addRow(): void {
    this.rows.update((r) => [...r, { method: 'upi', amount: Math.max(0, this.remaining()), reference: '' }]);
  }

  protected removeRow(i: number): void {
    this.rows.update((r) => r.filter((_, n) => n !== i));
  }

  protected setRow(i: number, patch: Partial<Row>): void {
    this.rows.update((r) => r.map((row, n) => (n === i ? { ...row, ...patch } : row)));
  }

  protected async settle(): Promise<void> {
    if (!this.canSettle()) return;
    const order = this.floor.order(this.orderId());
    if (!order) return;
    const ids = this.billIds();
    const items = this.floor.unbilledOf(order.id).filter((i) => !ids || ids.includes(i.id));
    const b = this.bill();
    const payments = this.rows().map((r) => ({ method: r.method, amount: r.amount, ...(r.reference.trim() ? { reference: r.reference.trim() } : {}) }));
    const tableName = this.floor.tableName(order.table_id);
    this.busy.set(true);
    this.error.set(null);
    try {
      // Name and phone go on the order first (repeat customers, the printed bill).
      if (this.custName().trim() || this.custPhone().trim()) {
        await this.floor.setCustomer(order.id, this.custName() || order.customer_name, this.custPhone() || order.customer_phone);
      }
      const billed = this.floor.order(order.id) ?? order;
      let saved;
      let finished = true;
      if (ids) {
        ({ bill: saved, finished } = await this.floor.settleSplit(order.id, ids, b.discount, payments));
      } else {
        saved = await this.floor.settle(order.id, b.discount, payments);
      }
      this.printer.receipt(billed, items, saved, payments, { subtotal: b.subtotal, discount: b.discount, tax: round2(b.cgst + b.sgst), roundOff: b.roundOff, total: b.total }, tableName);
      this.custName.set('');
      this.custPhone.set('');
      void this.day.loadLive();
      this.rows.set([]);
      this.discountValue.set(0);
      this.tendered.set(0);
      this.picked.set(new Set());
      if (finished) {
        this.byItems.set(false);
        this.done.emit();
      } else {
        const left = this.floor.unbilledOf(order.id).length;
        this.notice.set(`${saved ? 'Bill ' + saved.invoice_no : 'Bill'} printed · ${money(b.total)}. ${left} item${left === 1 ? '' : 's'} left to pay.`);
      }
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
