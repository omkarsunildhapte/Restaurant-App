import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { TabPanelComponent, TabsComponent } from '../../../shared/ui/tabs.component';
import { ToastService } from '../../../shared/ui/toast.service';
import { errorText } from '../../data/db';
import {
  ExpensesService,
  type Employee,
  type ExpenseMode,
  type PayRate,
  type PayType,
  type SalaryEntry,
  type SalaryKind,
  type SalaryRow,
} from '../../data/expenses.service';
import { WorkspaceStore } from '../../data/workspace.store';
import { downloadCsv } from '../../ui/csv';
import { rupees } from '../../ui/diet-mark';

const KIND_LABEL: Record<SalaryKind, string> = { salary: 'Salary paid', advance: 'Advance', bonus: 'Bonus', deduction: 'Deduction' };
const PAY_LABEL: Record<PayType, string> = { monthly: 'a month', daily: 'a day', hourly: 'an hour' };

type EmployeeWithRates = Employee & { employee_pay_rates: PayRate[] };

function isoDate(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

/** Staff pay: who is owed what this month, payments and advances, and the staff list. Owners only. */
@Component({
  selector: 'bp-salaries-page',
  imports: [FormsModule, ModalComponent, TabsComponent, TabPanelComponent],
  templateUrl: './salaries-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalariesPage implements OnInit {
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(ExpensesService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly rupees = rupees;
  protected readonly kindLabel = KIND_LABEL;
  protected readonly payLabel = PAY_LABEL;
  protected readonly kinds: SalaryKind[] = ['salary', 'advance', 'bonus', 'deduction'];
  protected readonly payModes: ExpenseMode[] = ['cash', 'upi', 'bank'];
  protected readonly tab = signal(0);

  protected readonly month = signal(isoDate(new Date()).slice(0, 7)); // yyyy-mm
  protected readonly rows = signal<SalaryRow[]>([]);
  protected readonly staff = signal<EmployeeWithRates[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly totals = computed(() =>
    this.rows().reduce(
      (t, r) => ({
        due: t.due + Number(r.due),
        paid: t.paid + Number(r.paid),
        advances: t.advances + Number(r.advances),
        balance: t.balance + Math.max(0, Number(r.balance)),
      }),
      { due: 0, paid: 0, advances: 0, balance: 0 },
    ),
  );

  protected readonly outletName = computed(() => {
    const names = new Map(this.ws.outlets().map((o) => [o.id, o.name]));
    return (id: string | null) => (id ? (names.get(id) ?? '') : 'All outlets');
  });

  // ---- Entry form (pay / advance / bonus / deduction)
  protected readonly entryOpen = signal(false);
  protected readonly entryFor = signal<SalaryRow | null>(null);
  protected readonly eKind = signal<SalaryKind>('salary');
  protected readonly eAmount = signal<number | null>(null);
  protected readonly eDate = signal(isoDate(new Date()));
  protected readonly eMode = signal<ExpenseMode>('cash');
  protected readonly eOutlet = signal('');
  protected readonly eNote = signal('');

  // ---- History
  protected readonly historyFor = signal<SalaryRow | null>(null);
  protected readonly history = signal<SalaryEntry[]>([]);

  // ---- Employee form
  protected readonly empOpen = signal(false);
  protected readonly empId = signal<string | null>(null);
  protected readonly empName = signal('');
  protected readonly empJob = signal('');
  protected readonly empPhone = signal('');
  protected readonly empOutlet = signal('');
  protected readonly empJoined = signal('');
  protected readonly empLeft = signal('');
  protected readonly empPayNote = signal('');
  protected readonly empActive = signal(true);
  protected readonly empPayType = signal<PayType>('monthly');
  protected readonly empRate = signal<number | null>(null);
  protected readonly empRateFrom = signal(isoDate(new Date()).slice(0, 8) + '01');
  protected readonly empRates = signal<PayRate[]>([]);

  protected readonly busy = signal(false);
  protected readonly formError = signal<string | null>(null);

  public ngOnInit(): void {
    void this.load();
  }

  protected monthStart(): string {
    return this.month() + '-01';
  }

  protected monthLabel(): string {
    return new Date(this.monthStart() + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  protected async load(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant || !this.month()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const [rows, staff] = await Promise.all([this.api.salaryMonth(tenant, this.monthStart()), this.api.employees(tenant)]);
      this.rows.set(rows);
      this.staff.set(staff);
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected shiftMonth(step: -1 | 1): void {
    const d = new Date(this.monthStart() + 'T00:00:00');
    d.setMonth(d.getMonth() + step);
    this.month.set(isoDate(d).slice(0, 7));
    void this.load();
  }

  protected payText(r: { pay_type: PayType | null; rate: number | null }): string {
    return r.pay_type && r.rate ? `${rupees(r.rate)} ${PAY_LABEL[r.pay_type]}` : 'No pay set';
  }

  // ---- Entries

  protected openEntry(r: SalaryRow, kind: SalaryKind): void {
    this.entryFor.set(r);
    this.eKind.set(kind);
    this.eAmount.set(kind === 'salary' && Number(r.balance) > 0 ? Number(r.balance) : null);
    // Paying for a past month happens today; for the current month, today as well.
    this.eDate.set(isoDate(new Date()));
    this.eMode.set('cash');
    this.eOutlet.set(r.outlet_id ?? this.ws.outletId() ?? this.ws.outlets()[0]?.id ?? '');
    this.eNote.set('');
    this.formError.set(null);
    this.entryOpen.set(true);
  }

  protected async saveEntry(): Promise<void> {
    const tenant = this.ws.tenantId();
    const r = this.entryFor();
    const amount = Number(this.eAmount());
    if (!tenant || !r) return;
    if (!(amount > 0)) {
      this.formError.set('Enter an amount.');
      return;
    }
    if (this.eKind() !== 'deduction' && this.eMode() === 'cash' && !this.eOutlet()) {
      this.formError.set('Choose which counter the cash came from.');
      return;
    }
    this.busy.set(true);
    this.formError.set(null);
    try {
      await this.api.addEntry(tenant, {
        employee_id: r.employee_id,
        kind: this.eKind(),
        amount,
        period_month: this.monthStart(),
        entry_date: this.eDate(),
        payment_mode: this.eKind() === 'deduction' ? null : this.eMode(),
        outlet_id: this.eOutlet() || null,
        note: this.eNote(),
      });
      this.entryOpen.set(false);
      this.toast.success(`${KIND_LABEL[this.eKind()]} of ${rupees(amount)} for ${r.full_name} saved.`);
      await this.load();
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async openHistory(r: SalaryRow): Promise<void> {
    this.history.set([]);
    this.historyFor.set(r);
    try {
      this.history.set(await this.api.entries(r.employee_id));
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }

  protected onHistoryVisible(open: boolean): void {
    if (!open) this.historyFor.set(null);
  }

  protected async deleteEntry(e: SalaryEntry): Promise<void> {
    const ok = await this.confirm.confirm({
      header: 'Delete entry',
      message: `Delete this ${KIND_LABEL[e.kind].toLowerCase()} of ${rupees(e.amount)}? Use this only for mistakes.`,
      icon: 'warning',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptVariant: 'danger',
    });
    if (!ok) return;
    try {
      await this.api.deleteEntry(e.id);
      this.history.update((list) => list.filter((x) => x.id !== e.id));
      await this.load();
    } catch (err) {
      this.toast.error(errorText(err));
    }
  }

  protected entryDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  protected monthOf(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  // ---- Staff list

  protected openEmployee(e: EmployeeWithRates | null): void {
    this.empId.set(e?.id ?? null);
    this.empName.set(e?.full_name ?? '');
    this.empJob.set(e?.job_title ?? '');
    this.empPhone.set(e?.phone ?? '');
    this.empOutlet.set(e?.outlet_id ?? (this.ws.outlets().length === 1 ? this.ws.outlets()[0]!.id : ''));
    this.empJoined.set(e?.joined_on ?? '');
    this.empLeft.set(e?.left_on ?? '');
    this.empPayNote.set(e?.payment_note ?? '');
    this.empActive.set(e?.is_active ?? true);
    const current = e?.employee_pay_rates[0];
    this.empPayType.set(current?.pay_type ?? 'monthly');
    this.empRate.set(current ? Number(current.rate) : null);
    this.empRateFrom.set(current ? current.effective_from : isoDate(new Date()).slice(0, 8) + '01');
    this.empRates.set(e?.employee_pay_rates ?? []);
    this.formError.set(null);
    this.empOpen.set(true);
  }

  protected async saveEmployee(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    if (!this.empName().trim()) {
      this.formError.set('Enter the name.');
      return;
    }
    const rate = Number(this.empRate());
    const current = this.empRates()[0];
    const rateChanged =
      this.empRate() !== null && (!current || Number(current.rate) !== rate || current.pay_type !== this.empPayType() || current.effective_from !== this.empRateFrom());
    if (this.empRate() !== null && !(rate > 0)) {
      this.formError.set('Pay must be more than zero.');
      return;
    }
    this.busy.set(true);
    this.formError.set(null);
    try {
      await this.api.saveEmployee(
        tenant,
        this.empId(),
        {
          full_name: this.empName(),
          job_title: this.empJob(),
          phone: this.empPhone(),
          outlet_id: this.empOutlet() || null,
          joined_on: this.empJoined() || null,
          left_on: this.empLeft() || null,
          payment_note: this.empPayNote(),
          is_active: this.empActive(),
        },
        rateChanged ? { pay_type: this.empPayType(), rate, effective_from: this.empRateFrom() } : null,
      );
      this.empOpen.set(false);
      this.toast.success(`${this.empName().trim()} saved.`);
      await this.load();
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected exportMonth(): void {
    downloadCsv(
      `salaries-${this.month()}.csv`,
      ['Name', 'Job', 'Pay', 'Due', 'Bonus', 'Deductions', 'Advances', 'Paid', 'Balance'],
      this.rows().map((r) => [
        r.full_name,
        r.job_title ?? '',
        this.payText(r),
        Number(r.due),
        Number(r.bonus),
        Number(r.deductions),
        Number(r.advances),
        Number(r.paid),
        Number(r.balance),
      ]),
    );
  }
}
