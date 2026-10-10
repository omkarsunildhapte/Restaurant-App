import { Injectable, computed, inject, signal } from '@angular/core';
import { db } from '@app/core/supabase.client';
import { SessionStore } from '@app/core/session.store';
import { round2, type CashOut, type DaySession, type DaySummary } from '@app/core/models';

/**
 * The counter's day: opened with the cash in the drawer, closed with a cash count that is
 * reconciled against cash payments (open_day / close_day in Supabase). Billing needs an open
 * day. Day open and close need the internet: they are the moments numbers must be exact.
 */
@Injectable({ providedIn: 'root' })
export class DayStore {
  private readonly session = inject(SessionStore);

  private readonly _current = signal<DaySession | null>(null);
  private readonly _last = signal<DaySession | null>(null);
  private readonly _live = signal<DaySummary | null>(null);
  private readonly _loaded = signal(false);
  private readonly _refreshing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _cashOut = signal<CashOut[]>([]);

  /** The open day at this outlet, or null. */
  readonly current = this._current.asReadonly();
  /** The most recent closed day (for the close report and reprint). */
  readonly last = this._last.asReadonly();
  /** Running totals of the open day. */
  readonly live = this._live.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  /** True while totals are being fetched again; amounts on screen may be out of date. */
  readonly refreshing = this._refreshing.asReadonly();
  readonly error = this._error.asReadonly();
  /** Cash paid out of the drawer during the open day (purchases, staff payments, other). */
  readonly cashOut = this._cashOut.asReadonly();
  readonly cashOutTotal = computed(() => round2(this._cashOut().reduce((s, c) => s + Number(c.amount), 0)));
  /**
   * What should be in the drawer now: opening cash + cash payments - cash paid out. The same sum
   * close_day makes in the database, so the number on screen is the number it will check.
   */
  readonly expectedCash = computed(() =>
    round2((this._current()?.opening_cash ?? 0) + (this._live()?.byMethod.cash ?? 0) - this.cashOutTotal()),
  );

  public async load(): Promise<void> {
    const outlet = this.session.outlet();
    if (!outlet) return;
    this._refreshing.set(true);
    try {
      await this.fetch(outlet.id);
    } finally {
      this._refreshing.set(false);
    }
  }

  private async fetch(outletId: string): Promise<void> {
    const { data, error } = await db()
      .from('day_sessions')
      .select('id, outlet_id, business_date, opened_at, opening_cash, closed_at, counted_cash, expected_cash, cash_difference, summary')
      .eq('outlet_id', outletId)
      .order('opened_at', { ascending: false })
      .limit(2);
    this._loaded.set(true);
    if (error) {
      this._error.set(error.message);
      return;
    }
    const rows = (data ?? []) as DaySession[];
    this._current.set(rows.find((r) => !r.closed_at) ?? null);
    this._last.set(rows.find((r) => r.closed_at) ?? null);
    this._error.set(null);
    if (this._current()) await this.loadLive();
  }

  /** Totals of the open day from its bills and payments. */
  public async loadLive(): Promise<void> {
    const day = this._current();
    if (!day) return;
    const c = db();
    const [bills, payments] = await Promise.all([
      c.from('bills').select('id, subtotal, discount, cgst, sgst, total, is_void').eq('day_session_id', day.id),
      c.from('bill_payments').select('bill_id, method, amount').eq('outlet_id', day.outlet_id).gte('created_at', day.opened_at),
    ]);
    if (bills.error || payments.error) return;
    const out = await c.rpc('cash_out_for_day', { p_session: day.id });
    this._cashOut.set(out.error ? [] : ((out.data ?? []) as CashOut[]));
    const live = (bills.data ?? []).filter((b) => !b.is_void);
    const liveIds = new Set(live.map((b) => b.id));
    const byMethod: DaySummary['byMethod'] = {};
    for (const p of payments.data ?? []) {
      if (!liveIds.has(p.bill_id)) continue;
      byMethod[p.method as keyof DaySummary['byMethod']] = (byMethod[p.method as keyof DaySummary['byMethod']] ?? 0) + Number(p.amount);
    }
    const sum = (k: 'subtotal' | 'discount' | 'cgst' | 'sgst' | 'total') => live.reduce((s, b) => s + Number(b[k]), 0);
    this._live.set({
      bills: live.length,
      voidBills: (bills.data ?? []).length - live.length,
      subtotal: sum('subtotal'),
      discount: sum('discount'),
      cgst: sum('cgst'),
      sgst: sum('sgst'),
      total: sum('total'),
      byMethod,
    });
  }

  public async open(openingCash: number): Promise<void> {
    const { data, error } = await db().rpc('open_day', { p_outlet: this.session.outlet()!.id, p_opening_cash: openingCash });
    if (error) throw new Error(error.message);
    this._current.set(data as DaySession);
    this._live.set(null);
  }

  /** Pays cash out of the drawer: a purchase (also lands in the owner's purchase records) or other. */
  public async payOut(kind: 'purchase' | 'other', label: string, amount: number): Promise<void> {
    const { error } = await db().rpc('record_cash_out', { p_outlet: this.session.outlet()!.id, p_kind: kind, p_label: label, p_amount: amount });
    if (error) throw new Error(error.message);
    await this.loadLive();
  }

  public async close(countedCash: number, notes: string | null): Promise<DaySession> {
    const { data, error } = await db().rpc('close_day', { p_outlet: this.session.outlet()!.id, p_counted_cash: countedCash, p_notes: notes });
    if (error) throw new Error(error.message);
    const closed = data as DaySession;
    this._current.set(null);
    this._last.set(closed);
    this._live.set(null);
    this._cashOut.set([]);
    return closed;
  }
}
