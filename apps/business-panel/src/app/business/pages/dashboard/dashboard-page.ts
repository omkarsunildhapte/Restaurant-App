import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BusinessService, type BusinessReport } from '../../data/business.service';
import { ExpensesService } from '../../data/expenses.service';
import { errorText } from '../../data/db';
import { WorkspaceStore } from '../../data/workspace.store';
import { rupees } from '../../ui/diet-mark';

type Range = 'today' | '7' | '30';

function isoDate(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function hourLabel(h: number): string {
  const suffix = h < 12 ? 'am' : 'pm';
  return `${h % 12 === 0 ? 12 : h % 12}${suffix}`;
}

/** Sales at a glance for owners and managers. */
@Component({
  selector: 'bp-dashboard-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(BusinessService);
  private readonly expenses = inject(ExpensesService);

  protected readonly range = signal<Range>('7');
  /** '' = all outlets (only offered to people who see every outlet) */
  protected readonly outlet = signal('');
  protected readonly report = signal<BusinessReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Purchases today / this month, and (owners only) salary paid and still due this month. */
  protected readonly spend = signal<{ today: number; month: number; unpaid: number; salaryPaid: number | null; salaryDue: number | null } | null>(null);

  protected readonly rupees = rupees;
  protected readonly hourLabel = hourLabel;

  protected readonly allOutletsAllowed = computed(() => this.ws.current()?.outlet_id === null);

  protected readonly days = computed(() => {
    const r = this.report();
    if (!r) return [];
    const max = Math.max(1, ...r.by_day.map((d) => Number(d.revenue)));
    return r.by_day.map((d) => ({
      label: new Date(d.day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      revenue: Number(d.revenue),
      orders: d.orders,
      pct: (Number(d.revenue) / max) * 100,
    }));
  });

  protected readonly hours = computed(() => {
    const r = this.report();
    if (!r?.by_hour.length) return [];
    const max = Math.max(1, ...r.by_hour.map((h) => h.orders));
    return r.by_hour.map((h) => ({ ...h, pct: (h.orders / max) * 100 }));
  });

  protected readonly busiest = computed(() => {
    const h = [...this.hours()].sort((a, b) => b.orders - a.orders)[0];
    return h ? `${hourLabel(h.hour)}–${hourLabel((h.hour + 1) % 24)}` : null;
  });

  public ngOnInit(): void {
    if (!this.allOutletsAllowed()) this.outlet.set(this.ws.current()?.outlet_id ?? '');
    void this.load();
  }

  protected setRange(r: Range): void {
    this.range.set(r);
    void this.load();
  }

  protected setOutlet(id: string): void {
    this.outlet.set(id);
    void this.load();
  }

  private async loadSpend(tenant: string): Promise<void> {
    const today = isoDate(new Date());
    const monthStart = today.slice(0, 8) + '01';
    const outlet = this.outlet() || null;
    try {
      const [day, month, salaries] = await Promise.all([
        this.expenses.summary(tenant, today, today, outlet),
        this.expenses.summary(tenant, monthStart, today, outlet),
        this.ws.isOwner() ? this.expenses.salaryMonth(tenant, monthStart) : Promise.resolve(null),
      ]);
      this.spend.set({
        today: Number(day.total),
        month: Number(month.total),
        unpaid: Number(month.unpaid),
        salaryPaid: salaries ? salaries.reduce((s, r) => s + Number(r.paid) + Number(r.advances), 0) : null,
        salaryDue: salaries ? salaries.reduce((s, r) => s + Math.max(0, Number(r.balance)), 0) : null,
      });
    } catch {
      this.spend.set(null); // the sales figures still show
    }
  }

  protected async load(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    void this.loadSpend(tenant);
    const to = new Date();
    const from = new Date();
    if (this.range() !== 'today') from.setDate(from.getDate() - Number(this.range()) + 1);
    this.loading.set(true);
    this.error.set(null);
    try {
      this.report.set(await this.api.report(tenant, isoDate(from), isoDate(to), this.outlet() || null));
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }
}
