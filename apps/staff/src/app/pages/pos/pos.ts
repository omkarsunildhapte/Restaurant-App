import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FloorStore, type NewItem } from '@app/core/floor.store';
import { SessionStore } from '@app/core/session.store';
import { DayStore } from '@app/core/day.store';
import { Printer } from '@app/core/printer';
import { minutesSince, money, type Order } from '@app/core/models';
import { MenuPicker } from '@app/pages/shared/menu-picker';
import { Ticket } from '@app/pages/shared/ticket';
import { Checkout } from '@app/pages/pos/checkout';
import { Availability } from '@app/pages/shared/availability';
import { I18n, TPipe } from '@app/core/i18n';

/**
 * The counter: every open order of the outlet (tables, takeaway, phone), the menu to add to
 * the selected one, and billing. Built for a PC, tablet or Android POS machine in landscape.
 */
@Component({
  selector: 'app-pos',
  imports: [FormsModule, MenuPicker, Ticket, Checkout, Availability, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full min-h-0 flex-col md:flex-row">
      <!-- Open orders -->
      <aside class="flex shrink-0 flex-col border-b border-ink-200 bg-white md:w-64 md:border-b-0 md:border-r">
        <div class="grid grid-cols-2 gap-1.5 p-2">
          <button type="button" (click)="newOrder()" class="btn-primary py-2.5">{{ 'pos.takeaway' | t }}</button>
          <button type="button" (click)="phoneOpen.set(true)" class="btn-secondary py-2.5">{{ 'pos.phoneOrder' | t }}</button>
        </div>
        <div class="flex gap-1 px-2 pb-2">
          @for (f of filters; track f.id) {
            <button type="button" (click)="filter.set(f.id)" class="chip text-xs" [class.chip-on]="filter() === f.id">{{ f.label | t }}</button>
          }
          <button type="button" (click)="soldOutOpen.set(true)" class="chip ml-auto text-xs">{{ 'avail.soldOut' | t }}</button>
        </div>
        <ul class="max-h-48 min-h-0 flex-1 overflow-y-auto md:max-h-none">
          @for (o of list(); track o.id) {
            <li>
              <button type="button" (click)="select(o.id)" class="flex w-full items-center gap-2 border-l-4 px-3 py-2.5 text-left hover:bg-ink-50"
                [class]="selected() === o.id ? 'border-brand-600 bg-brand-50' : o.bill_requested_at ? 'border-amber-500' : 'border-transparent'">
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-ink-900">{{ where(o) }}</span>
                  <span class="block text-xs text-ink-500">#{{ o.order_no ?? '…' }} · {{ 'tables.minutes' | t: { n: age(o) } }}{{ o.bill_requested_at ? ' · ' + ('pos.billAsked' | t) : '' }}</span>
                </span>
                <span class="text-sm font-medium tabular-nums text-ink-700">{{ money(o.total) }}</span>
              </button>
            </li>
          } @empty {
            <li class="px-3 py-6 text-center text-sm text-ink-400">{{ 'pos.none' | t }}</li>
          }
        </ul>
      </aside>

      @if (current(); as o) {
        <div class="min-h-0 flex-1 max-md:h-[45dvh]">
          <app-menu-picker (add)="add($event)" />
        </div>
        <aside class="flex min-h-0 shrink-0 flex-col border-t border-ink-200 bg-white md:w-96 md:border-l md:border-t-0">
          <div class="flex items-center gap-2 border-b border-ink-100 px-3 py-2">
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-ink-900">{{ where(o) }} · #{{ o.order_no ?? '…' }}</p>
              @if (o.customer_phone) { <p class="text-xs text-ink-500">{{ o.customer_phone }}</p> }
            </div>
            @if (o.type === 'dine_in' && !confirmCancel()) {
              <button type="button" (click)="tablePicker.set(true)" class="text-xs font-medium text-brand-600">{{ 'pos.moveMerge' | t }}</button>
            }
            @if (confirmCancel()) {
              <button type="button" (click)="cancel(o.id)" class="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white">{{ 'pos.cancelOrder' | t }}</button>
              <button type="button" (click)="confirmCancel.set(false)" class="text-xs text-ink-500">{{ 'pos.keep' | t }}</button>
            } @else {
              <button type="button" (click)="confirmCancel.set(true)" class="text-xs text-rose-600">{{ 'pos.cancelAsk' | t }}</button>
            }
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto">
            @if (mode() === 'ticket') {
              <app-ticket [orderId]="o.id" />
            } @else {
              <app-checkout [orderId]="o.id" (done)="settled()" />
            }
          </div>
          @if (error()) { <p class="px-3 text-sm text-rose-600" role="alert">{{ error() }}</p> }
          <div class="grid grid-cols-2 gap-2 border-t border-ink-100 p-2">
            @if (mode() === 'ticket') {
              <button type="button" (click)="sendKot(o)" [disabled]="!unsent()" class="btn-secondary py-3">{{ unsent() ? ('order.sendN' | t: { n: unsent() }) : ('order.send' | t) }}</button>
              <button type="button" (click)="mode.set('checkout')" [disabled]="!floor.itemsOf(o.id).length" class="btn-primary py-3">{{ 'pos.bill' | t: { amount: money(o.total) } }}</button>
            } @else {
              <button type="button" (click)="mode.set('ticket')" class="btn-secondary col-span-2 py-2.5">{{ 'pos.back' | t }}</button>
            }
          </div>
        </aside>
      } @else {
        <div class="grid flex-1 place-items-center p-6 text-center">
          <div>
            @if (lastBill()) { <p class="mb-2 text-sm font-medium text-emerald-700">{{ lastBill() }}</p> }
            <p class="text-sm text-ink-500">{{ 'pos.choose' | t }}</p>
          </div>
        </div>
      }
    </div>

    @if (phoneOpen()) {
      <div class="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="phone-title">
        <form class="w-full max-w-sm rounded-2xl bg-white p-5" (ngSubmit)="phoneOrder()">
          <h2 id="phone-title" class="text-lg font-semibold text-ink-900">{{ 'pos.phoneTitle' | t }}</h2>
          <label for="ph-name" class="field-label mt-3">{{ 'pos.customerName' | t }}</label>
          <input id="ph-name" name="name" [ngModel]="phoneName()" (ngModelChange)="phoneName.set($event)" class="field" />
          <label for="ph-phone" class="field-label mt-3">{{ 'pos.phone' | t }}</label>
          <input id="ph-phone" name="phone" type="tel" inputmode="tel" [ngModel]="phoneNo()" (ngModelChange)="phoneNo.set($event)" class="field" />
          <div class="mt-5 flex gap-2">
            <button type="button" (click)="phoneOpen.set(false)" class="btn-secondary flex-1 py-2.5">{{ 'common.cancel' | t }}</button>
            <button type="submit" [disabled]="!phoneName().trim() && !phoneNo().trim()" class="btn-primary flex-1 py-2.5">{{ 'pos.start' | t }}</button>
          </div>
        </form>
      </div>
    }

    @if (soldOutOpen()) { <app-availability (close)="soldOutOpen.set(false)" /> }

    @if (tablePicker() && current(); as o) {
      <div class="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="tp-title">
        <div class="w-full max-w-lg rounded-2xl bg-white p-5">
          <h2 id="tp-title" class="text-lg font-semibold text-ink-900">{{ 'pos.moveTitle' | t: { where: where(o) } }}</h2>
          <p class="text-sm text-ink-500">{{ 'pos.moveHint' | t }}</p>
          <div class="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
            @for (t of otherTables(); track t.table_id) {
              <button type="button" (click)="moveOrMerge(o, t.table_id, t.order_id)" [disabled]="busy()"
                class="aspect-square rounded-xl p-1 text-center text-sm font-bold"
                [class]="t.status === 'free' ? 'bg-white text-ink-800 ring-1 ring-ink-200' : 'bg-brand-600 text-white'">
                {{ t.name }}<span class="block text-[10px] font-normal">{{ (t.status === 'free' ? 'pos.move' : 'pos.merge') | t }}</span>
              </button>
            }
          </div>
          @if (error()) { <p class="mt-3 text-sm text-rose-600" role="alert">{{ error() }}</p> }
          <button type="button" (click)="tablePicker.set(false)" class="btn-secondary mt-4 w-full">{{ 'common.close' | t }}</button>
        </div>
      </div>
    }
  `,
})
export class Pos implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly soldOutOpen = signal(false);
  protected readonly tablePicker = signal(false);
  protected readonly busy = signal(false);
  protected readonly otherTables = computed(() => this.floor.tables().filter((t) => t.table_id !== this.current()?.table_id));

  /** /pos?order=… opens that order (Bills → "Bill again"). */
  public ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('order');
    if (id && this.floor.order(id)) {
      this.select(id);
      this.mode.set('checkout');
    }
  }

  protected async moveOrMerge(o: Order, tableId: string, otherOrderId: string | null): Promise<void> {
    this.busy.set(true);
    await this.run(async () => {
      if (otherOrderId) {
        // Everything on this table joins the busy one; that order is the one to bill.
        await this.floor.mergeInto(o.id, otherOrderId);
        this.select(otherOrderId);
      } else {
        await this.floor.moveTable(o.id, tableId);
        this.selectedLabel = this.where(this.floor.order(o.id) ?? o);
      }
    });
    this.busy.set(false);
    if (!this.error()) this.tablePicker.set(false);
  }
  protected readonly floor = inject(FloorStore);
  protected readonly session = inject(SessionStore);
  protected readonly day = inject(DayStore);
  private readonly printer = inject(Printer);
  private readonly i18n = inject(I18n);
  protected readonly money = money;

  protected readonly filters = [
    { id: 'all', label: 'pos.filterAll' },
    { id: 'dine_in', label: 'pos.filterTables' },
    { id: 'takeaway', label: 'pos.filterTakeaway' },
  ] as const;
  protected readonly filter = signal<'all' | 'dine_in' | 'takeaway'>('all');
  protected readonly selected = signal<string | null>(null);
  protected readonly mode = signal<'ticket' | 'checkout'>('ticket');
  protected readonly confirmCancel = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly lastBill = signal<string | null>(null);
  protected readonly phoneOpen = signal(false);
  protected readonly phoneName = signal('');
  protected readonly phoneNo = signal('');

  protected readonly list = computed(() => {
    const f = this.filter();
    return this.floor
      .orders()
      .filter((o) => f === 'all' || o.type === f)
      .sort((a, b) => Number(!!b.bill_requested_at) - Number(!!a.bill_requested_at) || a.created_at.localeCompare(b.created_at));
  });
  protected readonly current = computed(() => (this.selected() ? this.floor.order(this.selected()!) : undefined));
  protected readonly unsent = computed(() => (this.selected() ? this.floor.itemsOf(this.selected()!).filter((i) => !i.kot_id).length : 0));

  protected where(o: Order): string {
    if (o.type === 'dine_in') return this.i18n.t('where.table', { name: this.floor.tableName(o.table_id) ?? '?' });
    return this.i18n.t(o.type === 'takeaway' ? 'where.takeaway' : 'where.delivery') + (o.customer_name ? ' · ' + o.customer_name : '');
  }

  protected age(o: Order): number {
    return minutesSince(o.created_at);
  }

  private selectedLabel = '';

  protected select(id: string): void {
    const o = this.floor.order(id);
    this.selectedLabel = o ? this.where(o) : '';
    this.selected.set(id);
    this.mode.set('ticket');
    this.confirmCancel.set(false);
    this.error.set(null);
  }

  protected async newOrder(): Promise<void> {
    await this.run(async () => this.select((await this.floor.createOrder('takeaway')).id));
  }

  protected async phoneOrder(): Promise<void> {
    this.phoneOpen.set(false);
    await this.run(async () => this.select((await this.floor.createOrder('takeaway', { customerName: this.phoneName(), customerPhone: this.phoneNo() })).id));
    this.phoneName.set('');
    this.phoneNo.set('');
  }

  protected async add(item: NewItem): Promise<void> {
    const id = this.selected();
    if (id) await this.run(() => this.floor.addItem(id, item));
  }

  protected async sendKot(o: Order): Promise<void> {
    // Not dishes (packaging) don't go to the kitchen slip.
    const unsent = this.floor.itemsOf(o.id).filter((i) => !i.kot_id && i.item_id !== null);
    const round = Math.max(0, ...this.floor.kotsOf(o.id).map((k) => k.round_no)) + 1;
    await this.run(() => this.floor.sendKot(o.id));
    // Counters without a kitchen screen print the KOT for the kitchen.
    if (!this.error()) this.printer.kot(o, { round_no: round }, unsent, this.floor.tableName(o.table_id));
  }

  protected async cancel(id: string): Promise<void> {
    await this.run(() => this.floor.cancelOrder(id));
    this.selected.set(null);
  }

  /** The order is already gone from the open list by now, so the label was taken at selection. */
  protected settled(): void {
    this.lastBill.set(this.i18n.t('pos.billed', { where: this.selectedLabel }));
    this.selected.set(null);
    this.mode.set('ticket');
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    this.error.set(null);
    try {
      await fn();
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
}
