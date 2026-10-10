import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { supabase } from '@app/core/supabase';

type Status = 'open' | 'paid' | 'void';
type Method = 'upi' | 'cash' | 'card' | 'other';

interface Invoice {
  id: string;
  tenant_id: string;
  invoice_no: string;
  period_start: string;
  plan_id: string;
  amount: number;
  cgst: number;
  sgst: number;
  total: number;
  status: Status;
  due_on: string;
  paid_at: string | null;
  buyer_name: string;
  subscription_payments: { amount: number }[];
}

interface Overview {
  mrr: number;
  outstanding: number;
  overdue: number;
  collectedThisMonth: number;
  paying: number;
  pastDue: number;
  inTrial: number;
  trialsEndingThisWeek: number;
}

interface PriceRow {
  id: string;
  name: string;
  plan_id: string;
  status: string;
  plans: { price_monthly: number } | null;
  tenant_billing: { monthly_price: number | null; is_founding: boolean; price_locked_until: string | null } | null;
}

interface Settings {
  seller_name: string;
  seller_gstin: string | null;
  seller_state: string;
  seller_address: string | null;
  seller_email: string | null;
  invoice_due_days: number;
  past_due_after_days: number;
  trial_grace_days: number | null;
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0 });

/**
 * What restaurants pay the platform: monthly GST invoices, payments received (recorded by hand
 * until online collection exists), founding prices, and the billing rules. Super Admin only;
 * everything goes through the billing functions in Supabase (migration 0008).
 */
@Component({
  selector: 'app-billing',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing.html',
})
export class Billing implements OnInit {
  protected readonly money = (n: number | null | undefined) => inr.format(Number(n ?? 0));
  protected readonly tabs = ['invoices', 'prices', 'settings'] as const;
  protected readonly tab = signal<(typeof this.tabs)[number]>('invoices');
  protected readonly statusFilters: readonly (Status | 'all')[] = ['open', 'paid', 'void', 'all'];
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected readonly overview = signal<Overview | null>(null);
  protected readonly invoices = signal<Invoice[]>([]);
  protected readonly statusFilter = signal<Status | 'all'>('open');
  protected readonly prices = signal<PriceRow[]>([]);
  protected readonly settings = signal<Settings | null>(null);

  protected readonly shown = computed(() => {
    const f = this.statusFilter();
    return this.invoices().filter((i) => f === 'all' || i.status === f);
  });

  // Record payment
  protected readonly paying = signal<Invoice | null>(null);
  protected readonly payAmount = signal(0);
  protected readonly payMethod = signal<Method>('upi');
  protected readonly payRef = signal('');
  protected readonly payDate = signal(new Date().toISOString().slice(0, 10));
  // Void
  protected readonly voiding = signal<Invoice | null>(null);
  protected readonly voidReason = signal('');
  // Price edit
  protected readonly editing = signal<PriceRow | null>(null);
  protected readonly editPrice = signal<number | null>(null);
  protected readonly editFounding = signal(false);
  protected readonly editLock = signal<string>('');

  public ngOnInit(): void {
    void this.loadAll();
  }

  protected paid(i: Invoice): number {
    return i.subscription_payments.reduce((s, p) => s + Number(p.amount), 0);
  }

  protected due(i: Invoice): number {
    return Math.round((Number(i.total) - this.paid(i)) * 100) / 100;
  }

  protected overdue(i: Invoice): boolean {
    return i.status === 'open' && i.due_on < new Date().toISOString().slice(0, 10);
  }

  protected month(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  protected async loadAll(): Promise<void> {
    if (!supabase) return;
    this.error.set(null);
    const [ov, inv, pr, st] = await Promise.all([
      supabase.rpc('billing_overview'),
      supabase
        .from('subscription_invoices')
        .select('id, tenant_id, invoice_no, period_start, plan_id, amount, cgst, sgst, total, status, due_on, paid_at, buyer_name, subscription_payments(amount)')
        .order('issued_at', { ascending: false })
        .limit(500),
      supabase
        .from('tenants')
        .select('id, name, plan_id, status, plans(price_monthly), tenant_billing(monthly_price, is_founding, price_locked_until)')
        .order('name'),
      supabase.from('platform_settings').select('*').eq('id', 1).single(),
    ]);
    const failed = [ov, inv, pr, st].find((r) => r.error);
    if (failed?.error) {
      this.error.set(failed.error.message);
      return;
    }
    this.overview.set(ov.data as Overview);
    this.invoices.set((inv.data ?? []) as unknown as Invoice[]);
    this.prices.set((pr.data ?? []) as unknown as PriceRow[]);
    this.settings.set(st.data as Settings);
  }

  protected async runCycle(): Promise<void> {
    await this.act(async () => {
      const r = await supabase!.rpc('run_billing_cycle');
      if (r.error) throw new Error(r.error.message);
      const d = r.data as { invoicesRaised: number; markedPastDue: number; trialsSuspended: number };
      this.notice.set(`Billing run: ${d.invoicesRaised} invoice(s) raised, ${d.markedPastDue} marked past due, ${d.trialsSuspended} trial(s) suspended.`);
    });
  }

  protected startPayment(i: Invoice): void {
    this.paying.set(i);
    this.payAmount.set(this.due(i));
    this.payMethod.set('upi');
    this.payRef.set('');
    this.payDate.set(new Date().toISOString().slice(0, 10));
  }

  protected async recordPayment(): Promise<void> {
    const i = this.paying();
    if (!i) return;
    await this.act(async () => {
      const r = await supabase!.rpc('record_subscription_payment', {
        p_invoice: i.id, p_amount: this.payAmount(), p_method: this.payMethod(), p_reference: this.payRef() || null, p_paid_on: this.payDate(),
      });
      if (r.error) throw new Error(r.error.message);
      this.notice.set(`${this.money(this.payAmount())} recorded on ${i.invoice_no}.`);
      this.paying.set(null);
    });
  }

  protected async voidInvoice(): Promise<void> {
    const i = this.voiding();
    if (!i) return;
    await this.act(async () => {
      const r = await supabase!.rpc('void_subscription_invoice', { p_invoice: i.id, p_reason: this.voidReason() });
      if (r.error) throw new Error(r.error.message);
      this.notice.set(`${i.invoice_no} is void.`);
      this.voiding.set(null);
      this.voidReason.set('');
    });
  }

  protected startPrice(row: PriceRow): void {
    this.editing.set(row);
    this.editPrice.set(row.tenant_billing?.monthly_price ?? null);
    this.editFounding.set(row.tenant_billing?.is_founding ?? false);
    this.editLock.set(row.tenant_billing?.price_locked_until ?? '');
  }

  protected async savePrice(): Promise<void> {
    const row = this.editing();
    if (!row) return;
    await this.act(async () => {
      const r = await supabase!.from('tenant_billing').upsert({
        tenant_id: row.id,
        monthly_price: this.editPrice() === null || (this.editPrice() as unknown) === '' ? null : Number(this.editPrice()),
        is_founding: this.editFounding(),
        price_locked_until: this.editLock() || null,
      });
      if (r.error) throw new Error(r.error.message);
      this.notice.set(`Price saved for ${row.name}.`);
      this.editing.set(null);
    });
  }

  protected async saveSettings(): Promise<void> {
    const s = this.settings();
    if (!s) return;
    await this.act(async () => {
      const r = await supabase!.from('platform_settings').update({
        seller_name: s.seller_name, seller_gstin: s.seller_gstin?.trim().toUpperCase() || null, seller_state: s.seller_state,
        seller_address: s.seller_address || null, seller_email: s.seller_email || null,
        invoice_due_days: Number(s.invoice_due_days), past_due_after_days: Number(s.past_due_after_days),
        trial_grace_days: s.trial_grace_days === null || (s.trial_grace_days as unknown) === '' ? null : Number(s.trial_grace_days),
      }).eq('id', 1);
      if (r.error) throw new Error(r.error.message);
      this.notice.set('Billing settings saved.');
    });
  }

  protected patchSettings<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.settings.update((s) => (s ? { ...s, [key]: value } : s));
  }

  private async act(fn: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    this.notice.set(null);
    try {
      await fn();
      await this.loadAll();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
