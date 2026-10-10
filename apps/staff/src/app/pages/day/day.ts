import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DayStore } from '@app/core/day.store';
import { FloorStore } from '@app/core/floor.store';
import { Outbox } from '@app/core/outbox';
import { MenuStore } from '@app/core/menu.store';
import { SessionStore } from '@app/core/session.store';
import { money, round2, type DaySession, type DaySummary } from '@app/core/models';
import { TPipe, type I18nKey } from '@app/core/i18n';

/**
 * Day open and close at the counter. Open with the cash in the drawer; close by counting it:
 * the database works out the cash that should be there (opening + cash payments) and the
 * difference, and freezes the day's totals.
 */
@Component({
  selector: 'app-day',
  imports: [FormsModule, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-2xl space-y-4 p-4">
      @if (!outbox.online()) {
        <p class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{{ 'day.needNet' | t }}</p>
      }
      @if (error()) { <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{{ error() }}</p> }

      @if (day.current(); as d) {
        <section class="card">
          <h1 class="text-lg font-semibold text-ink-900">{{ 'day.open' | t: { date: d.business_date } }}</h1>
          <p class="text-sm text-ink-500">{{ 'day.opened' | t: { time: time(d.opened_at), amount: money(d.opening_cash) } }}</p>
          @if (day.live(); as s) {
            <dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="rounded-lg bg-ink-50 p-3"><dt class="text-xs text-ink-500">{{ 'day.sales' | t }}</dt><dd class="text-lg font-semibold">{{ money(s.total) }}</dd></div>
              <div class="rounded-lg bg-ink-50 p-3"><dt class="text-xs text-ink-500">{{ 'day.bills' | t }}</dt><dd class="text-lg font-semibold">{{ s.bills }}</dd></div>
              <div class="rounded-lg bg-ink-50 p-3"><dt class="text-xs text-ink-500">{{ 'day.cash' | t }}</dt><dd class="text-lg font-semibold">{{ money(s.byMethod.cash) }}</dd></div>
              <div class="rounded-lg bg-ink-50 p-3"><dt class="text-xs text-ink-500">{{ 'day.upiCard' | t }}</dt><dd class="text-lg font-semibold">{{ money((s.byMethod.upi ?? 0) + (s.byMethod.card ?? 0)) }}</dd></div>
            </dl>
          }
        </section>

        <section class="card space-y-3">
          <h2 class="font-semibold text-ink-900">{{ 'day.paidOut' | t }}</h2>
          @for (c of day.cashOut(); track $index) {
            <div class="flex items-center justify-between gap-3 text-sm">
              <span><span class="mr-2 rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-600">{{ kindKey(c.kind) | t }}</span>{{ c.label }}<span class="text-xs text-ink-400"> · {{ time(c.paid_at) }}{{ c.recorded_by_name ? ' · ' + c.recorded_by_name : '' }}</span></span>
              <span class="tabular-nums text-rose-700">−{{ money(c.amount) }}</span>
            </div>
          } @empty {
            <p class="text-sm text-ink-400">{{ 'day.nothingPaid' | t }}</p>
          }
          <form class="grid grid-cols-[auto_1fr_7rem_auto] items-end gap-2 border-t border-ink-100 pt-3" (ngSubmit)="payOut()">
            <div>
              <label for="po-kind" class="field-label">{{ 'day.type' | t }}</label>
              <select id="po-kind" name="kind" [ngModel]="payKind()" (ngModelChange)="payKind.set($event)" class="field">
                <option value="purchase">{{ 'day.kind.purchase' | t }}</option>
                <option value="other">{{ 'day.kind.other' | t }}</option>
              </select>
            </div>
            <div>
              <label for="po-label" class="field-label">{{ 'day.for' | t }}</label>
              <input id="po-label" name="label" required [ngModel]="payLabel()" (ngModelChange)="payLabel.set($event)" [placeholder]="'day.forPlaceholder' | t" class="field" />
            </div>
            <div>
              <label for="po-amount" class="field-label">{{ 'day.amount' | t }}</label>
              <input id="po-amount" name="amount" type="number" min="1" step="1" required [ngModel]="payAmount()" (ngModelChange)="payAmount.set($event === '' ? null : +$event)" class="field" />
            </div>
            <button type="submit" [disabled]="busy() || !payLabel().trim() || !(payAmount() ?? 0) || !outbox.online()" class="btn-secondary py-2">{{ 'day.payOut' | t }}</button>
          </form>
        </section>

        <section class="card">
          @if (floor.orders().length) {
            <p class="text-sm text-amber-700">{{ 'day.openOrders' | t: { n: floor.orders().length } }}</p>
          } @else {
            <p class="text-sm text-ink-500">{{ 'day.noOpen' | t }}</p>
          }
          <dl class="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <dt class="text-ink-500">{{ 'day.openingCash' | t }}</dt><dd class="text-right tabular-nums">{{ money(d.opening_cash) }}</dd>
            <dt class="text-ink-500">{{ 'day.plusCash' | t }}</dt><dd class="text-right tabular-nums">{{ money(day.live()?.byMethod?.cash) }}</dd>
            <dt class="text-ink-500">{{ 'day.minusOut' | t }}</dt><dd class="text-right tabular-nums">{{ money(day.cashOutTotal()) }}</dd>
            <dt class="font-semibold text-ink-900">{{ 'day.shouldBeDrawer' | t }}</dt><dd class="text-right font-semibold tabular-nums">{{ money(expected()) }}</dd>
          </dl>
        </section>

        <form class="card space-y-3" (ngSubmit)="close()">
          <h2 class="font-semibold text-ink-900">{{ 'day.closeTitle' | t }}</h2>
          <p class="text-sm text-ink-500">{{ 'day.count' | t }}</p>
          @if (outbox.pendingCount()) { <p class="text-sm text-amber-700">{{ 'day.waitSync' | t: { n: outbox.pendingCount() } }}</p> }
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="counted" class="field-label">{{ 'day.counted' | t }}</label>
              <input id="counted" name="counted" type="number" min="0" step="1" required [ngModel]="counted()" (ngModelChange)="counted.set($event === '' ? null : +$event)" class="field" />
            </div>
            <div>
              <p class="field-label">{{ 'day.shouldBe' | t }}</p>
              <p class="mt-2 text-lg font-semibold tabular-nums" [class.opacity-40]="day.refreshing()" [attr.aria-busy]="day.refreshing()">{{ money(expected()) }}</p>
              @if (day.refreshing()) { <p class="text-xs text-ink-400">{{ 'day.updating' | t }}</p> }
            </div>
          </div>
          @if (counted() !== null) {
            <p class="text-sm font-medium" [class]="difference() === 0 ? 'text-emerald-700' : 'text-rose-600'">
              {{ difference() === 0 ? ('day.matches' | t) : ((difference() > 0 ? 'day.extra' : 'day.short') | t: { amount: money(abs(difference())) }) }}
            </p>
          }
          <label for="notes" class="field-label">{{ 'day.notes' | t }} <span class="font-normal text-ink-400">{{ 'day.optional' | t }}</span></label>
          <input id="notes" name="notes" [ngModel]="notes()" (ngModelChange)="notes.set($event)" [placeholder]="'day.notesPlaceholder' | t" class="field" />
          <button type="submit" [disabled]="busy() || counted() === null || !outbox.online() || outbox.pendingCount() > 0" class="btn-primary w-full py-3">{{ (busy() ? 'day.closing' : 'day.close') | t }}</button>
        </form>
      } @else if (day.loaded()) {
        <form class="card space-y-3" (ngSubmit)="open()">
          <h1 class="text-lg font-semibold text-ink-900">{{ 'day.openTitle' | t }}</h1>
          <p class="text-sm text-ink-500">{{ 'day.countFirst' | t }}</p>
          <label for="opening" class="field-label">{{ 'day.openingCash' | t }}</label>
          <input id="opening" name="opening" type="number" min="0" step="1" [ngModel]="opening()" (ngModelChange)="opening.set(+$event || 0)" class="field" />
          <button type="submit" [disabled]="busy() || !outbox.online()" class="btn-primary w-full py-3">{{ (busy() ? 'day.opening' : 'day.openBtn') | t }}</button>
        </form>
      } @else {
        <p class="text-sm text-ink-500">{{ 'common.loading' | t }}</p>
      }

      @if (day.last(); as l) {
        @if (l.summary; as s) {
          <section class="card">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="font-semibold text-ink-900">{{ 'day.lastClosed' | t: { date: l.business_date } }}</h2>
              <a [href]="summaryHref(l, s)" target="_blank" rel="noopener" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">{{ 'day.sendSummary' | t }}</a>
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <dt class="text-ink-500">{{ 'day.bills' | t }}</dt><dd class="text-right">{{ s.voidBills ? ('day.billsVoid' | t: { n: s.bills, v: s.voidBills }) : s.bills }}</dd>
              <dt class="text-ink-500">{{ 'day.salesGst' | t }}</dt><dd class="text-right font-semibold">{{ money(s.total) }}</dd>
              <dt class="text-ink-500">{{ 'day.discounts' | t }}</dt><dd class="text-right">{{ money(s.discount) }}</dd>
              <dt class="text-ink-500">{{ 'day.cgstSgst' | t }}</dt><dd class="text-right">{{ money(s.cgst) }} / {{ money(s.sgst) }}</dd>
              @for (m of methodsOf(s); track m.method) {
                <dt class="text-ink-500">{{ m.method.toUpperCase() }}</dt><dd class="text-right">{{ money(m.amount) }}</dd>
              }
              @if (s.cashOut) {
                <dt class="text-ink-500">{{ 'day.paidOut' | t }}</dt><dd class="text-right">−{{ money(s.cashOut) }}</dd>
              }
              <dt class="text-ink-500">{{ 'day.expectedCounted' | t }}</dt><dd class="text-right">{{ money(l.expected_cash) }} / {{ money(l.counted_cash) }}</dd>
              <dt class="text-ink-500">{{ 'day.difference' | t }}</dt>
              <dd class="text-right font-semibold" [class]="(l.cash_difference ?? 0) === 0 ? 'text-emerald-700' : 'text-rose-600'">{{ money(l.cash_difference) }}</dd>
            </dl>
          </section>
        }
      }
    </div>
  `,
})
export class Day implements OnInit {
  protected readonly day = inject(DayStore);
  protected readonly floor = inject(FloorStore);
  protected readonly outbox = inject(Outbox);
  protected readonly money = money;
  private readonly menu = inject(MenuStore);
  private readonly session = inject(SessionStore);

  /**
   * The day's numbers as a WhatsApp message for the owner: to the business phone when it is set
   * (Business panel), otherwise WhatsApp asks who to send it to.
   */
  protected summaryHref(l: DaySession, s: DaySummary): string {
    const by = s.byMethod;
    const lines = [
      `${this.session.workspace()?.tenant_name ?? ''} · ${this.session.outlet()?.name ?? ''}`,
      `Day closed: ${l.business_date}`,
      `Sales: ${money(s.total)} (${s.bills} bills${s.voidBills ? ', ' + s.voidBills + ' void' : ''})`,
      `Cash ${money(by.cash)} · UPI ${money(by.upi)} · Card ${money(by.card)}${by.other ? ' · Other ' + money(by.other) : ''}`,
      `Discounts ${money(s.discount)} · GST ${money(s.cgst + s.sgst)}`,
      ...(s.cashOut ? [`Cash paid out: ${money(s.cashOut)}`] : []),
      `Cash expected ${money(l.expected_cash)}, counted ${money(l.counted_cash)} (${(l.cash_difference ?? 0) === 0 ? 'matches' : (l.cash_difference ?? 0) > 0 ? 'extra ' + money(l.cash_difference) : 'short ' + money(Math.abs(l.cash_difference ?? 0))})`,
      ...(s.openOrders ? [`Open orders carried over: ${s.openOrders}`] : []),
      'Sent from Thaliyo',
    ];
    const phone = (this.menu.menu().ownerPhone ?? '').replace(/\D/g, '');
    const to = phone.length === 10 ? '91' + phone : phone.length === 12 ? phone : '';
    return `https://wa.me/${to}?text=` + encodeURIComponent(lines.join('\n'));
  }
  protected readonly abs = Math.abs;

  /** Payout types from the database (purchase, salary, other); an unknown one shows as itself. */
  protected kindKey(kind: string): I18nKey {
    return ('day.kind.' + kind) as I18nKey;
  }

  protected readonly opening = signal(0);
  protected readonly counted = signal<number | null>(null);
  protected readonly notes = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly expected = this.day.expectedCash;
  protected readonly payKind = signal<'purchase' | 'other'>('purchase');
  protected readonly payLabel = signal('');
  protected readonly payAmount = signal<number | null>(null);
  protected readonly difference = computed(() => round2((this.counted() ?? 0) - this.expected()));

  public ngOnInit(): void {
    void this.day.load();
  }

  protected time(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }

  protected methodsOf(s: DaySummary): { method: string; amount: number }[] {
    return Object.entries(s.byMethod).map(([method, amount]) => ({ method, amount: amount ?? 0 }));
  }

  protected async open(): Promise<void> {
    await this.run(() => this.day.open(this.opening()));
  }

  protected async payOut(): Promise<void> {
    const amount = this.payAmount();
    if (!amount || !this.payLabel().trim()) return;
    await this.run(async () => {
      await this.day.payOut(this.payKind(), this.payLabel().trim(), amount);
      this.payLabel.set('');
      this.payAmount.set(null);
    });
  }

  protected async close(): Promise<void> {
    const counted = this.counted();
    if (counted === null) return;
    await this.run(async () => {
      await this.day.close(counted, this.notes().trim() || null);
      this.counted.set(null);
      this.notes.set('');
    });
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await fn();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
