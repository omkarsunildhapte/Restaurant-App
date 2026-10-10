import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { BusinessDb, errorText, unwrap, type Tables } from '../../data/db';
import { WorkspaceStore } from '../../data/workspace.store';
import { rupees } from '../../ui/diet-mark';

type Invoice = Pick<
  Tables<'subscription_invoices'>,
  'id' | 'invoice_no' | 'period_start' | 'period_end' | 'plan_id' | 'amount' | 'cgst' | 'sgst' | 'total' | 'status' | 'due_on' | 'paid_at'
> & { subscription_payments: Pick<Tables<'subscription_payments'>, 'amount' | 'method' | 'paid_on' | 'reference'>[] };

const STATUS: Record<string, string> = {
  trial: 'Free trial',
  active: 'Active',
  past_due: 'Payment due',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
};

/** What the restaurant pays the platform: plan, trial, and its monthly GST invoices. Owners only. */
@Component({
  selector: 'bp-billing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-4 text-2xl font-semibold text-gray-900">Plan & billing</h1>

    @if (error()) {
      <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{{ error() }}</div>
    }

    <section class="mb-6 grid gap-3 sm:grid-cols-3">
      <div class="rounded-md bg-white p-4 shadow-xs">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Plan</p>
        <p class="mt-1 text-xl font-semibold capitalize text-gray-900">{{ plan()?.name ?? ws.current()?.plan_id }}</p>
        <p class="text-sm text-gray-500">{{ plan() ? rupees(price()) + ' a month + 18% GST' : '' }}</p>
        @if (founding()) {
          <p class="mt-1 text-xs text-green-700">Founding price{{ lockedUntil() ? ' until ' + date(lockedUntil()!) : '' }}</p>
        }
      </div>
      <div class="rounded-md bg-white p-4 shadow-xs">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
        <p class="mt-1 text-xl font-semibold text-gray-900">{{ statusLabel() }}</p>
        @if (ws.current()?.status === 'trial' && ws.current()?.trial_ends_at) {
          <p class="text-sm text-gray-500">Trial ends {{ date(ws.current()!.trial_ends_at!) }}</p>
        }
      </div>
      <div class="rounded-md bg-white p-4 shadow-xs">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Outstanding</p>
        <p class="mt-1 text-xl font-semibold" [class]="outstanding() > 0 ? 'text-amber-700' : 'text-gray-900'">{{ rupees(outstanding()) }}</p>
        <p class="text-sm text-gray-500">Pay by UPI or bank transfer; we record it here.</p>
      </div>
    </section>

    <div class="overflow-x-auto rounded-md bg-white shadow-xs">
      <table class="w-full min-w-[40rem] text-left text-sm">
        <thead class="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th class="px-4 py-3">Invoice</th>
            <th class="px-4 py-3">Month</th>
            <th class="px-4 py-3 text-right">Amount</th>
            <th class="px-4 py-3 text-right">GST</th>
            <th class="px-4 py-3 text-right">Total</th>
            <th class="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (i of invoices(); track i.id) {
            <tr>
              <td class="px-4 py-3 font-medium text-gray-900">{{ i.invoice_no }}</td>
              <td class="px-4 py-3 text-gray-600">{{ month(i.period_start) }}</td>
              <td class="px-4 py-3 text-right">{{ rupees(i.amount) }}</td>
              <td class="px-4 py-3 text-right text-gray-600">{{ rupees(i.cgst + i.sgst) }}</td>
              <td class="px-4 py-3 text-right font-medium text-gray-900">{{ rupees(i.total) }}</td>
              <td class="px-4 py-3">
                @switch (i.status) {
                  @case ('paid') { <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Paid {{ i.paid_at ? date(i.paid_at) : '' }}</span> }
                  @case ('void') { <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Void</span> }
                  @default {
                    <span class="rounded-full px-2 py-0.5 text-xs" [class]="overdue(i) ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'">
                      {{ overdue(i) ? 'Overdue' : 'Due' }} {{ date(i.due_on) }}
                    </span>
                    @if (paid(i) > 0) { <span class="ml-1 text-xs text-gray-500">{{ rupees(paid(i)) }} received</span> }
                  }
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="px-4 py-10 text-center text-gray-500">
                {{ loading() ? 'Loading…' : ws.current()?.status === 'trial' ? 'No invoices during the free trial.' : 'No invoices yet.' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class BillingPage implements OnInit {
  protected readonly ws = inject(WorkspaceStore);
  private readonly db = inject(BusinessDb);
  protected readonly rupees = rupees;

  protected readonly invoices = signal<Invoice[]>([]);
  protected readonly plan = signal<{ name: string; price_monthly: number } | null>(null);
  protected readonly billing = signal<Pick<Tables<'tenant_billing'>, 'monthly_price' | 'is_founding' | 'price_locked_until'> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly statusLabel = computed(() => STATUS[this.ws.current()?.status ?? ''] ?? '');
  protected readonly founding = computed(() => this.billing()?.is_founding === true);
  protected readonly lockedUntil = computed(() => this.billing()?.price_locked_until ?? null);
  protected readonly price = computed(() => {
    const b = this.billing();
    const locked = b?.monthly_price !== null && b?.monthly_price !== undefined && (!b.price_locked_until || new Date(b.price_locked_until) >= new Date());
    return locked ? Number(b!.monthly_price) : Number(this.plan()?.price_monthly ?? 0);
  });
  protected readonly outstanding = computed(() =>
    this.invoices()
      .filter((i) => i.status === 'open')
      .reduce((s, i) => s + Number(i.total) - this.paid(i), 0),
  );

  public async ngOnInit(): Promise<void> {
    const tenant = this.ws.tenantId();
    const planId = this.ws.current()?.plan_id;
    if (!tenant || !planId) return;
    this.loading.set(true);
    try {
      const c = this.db.client;
      const [plan, billing, invoices] = await Promise.all([
        c.from('plans').select('name, price_monthly').eq('id', planId).single(),
        c.from('tenant_billing').select('monthly_price, is_founding, price_locked_until').eq('tenant_id', tenant).maybeSingle(),
        c.from('subscription_invoices')
          .select('id, invoice_no, period_start, period_end, plan_id, amount, cgst, sgst, total, status, due_on, paid_at, subscription_payments(amount, method, paid_on, reference)')
          .eq('tenant_id', tenant)
          .order('period_start', { ascending: false }),
      ]);
      this.plan.set(unwrap(plan));
      this.billing.set(billing.data ?? null);
      this.invoices.set(unwrap(invoices) as unknown as Invoice[]);
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected paid(i: Invoice): number {
    return i.subscription_payments.reduce((s, p) => s + Number(p.amount), 0);
  }

  protected overdue(i: Invoice): boolean {
    return i.status === 'open' && new Date(i.due_on + 'T23:59:59') < new Date();
  }

  protected date(iso: string): string {
    return new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  protected month(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
}
