import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '@app/core/auth.store';
import { TeamStore } from '@app/core/team.store';
import { money, type Dealer } from '@app/core/crm';

interface DealerForm {
  name: string;
  company: string;
  phone: string;
  email: string;
  area: string;
  commissionPct: number;
  isActive: boolean;
  notes: string;
}

const EMPTY: DealerForm = { name: '', company: '', phone: '', email: '', area: '', commissionPct: 20, isActive: true, notes: '' };

/** Billing-machine and printer dealers who bring restaurants in, and what they are owed. */
@Component({
  selector: 'app-dealers',
  imports: [FormsModule],
  templateUrl: './dealers.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dealers implements OnInit {
  protected readonly team = inject(TeamStore);
  protected readonly auth = inject(AuthStore);
  protected readonly money = money;

  /** null = form closed, '' = adding, an id = editing that dealer. */
  protected readonly editing = signal<string | null>(null);
  protected readonly form = signal<DealerForm>({ ...EMPTY });
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly totalCommission = computed(() =>
    this.team.dealers().reduce((sum, d) => sum + (d.isActive ? d.monthlyCommissionInr : 0), 0),
  );

  public ngOnInit(): void {
    this.team.loadDealers();
  }

  protected add(): void {
    this.form.set({ ...EMPTY });
    this.error.set(null);
    this.editing.set('');
  }

  protected edit(d: Dealer): void {
    this.form.set({
      name: d.name,
      company: d.company ?? '',
      phone: d.phone ?? '',
      email: d.email ?? '',
      area: d.area ?? '',
      commissionPct: d.commissionPct,
      isActive: d.isActive,
      notes: d.notes ?? '',
    });
    this.error.set(null);
    this.editing.set(d.id);
  }

  protected patch<K extends keyof DealerForm>(key: K, value: DealerForm[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected save(): void {
    const f = this.form();
    if (!f.name.trim()) return;
    const blankToNull = (s: string) => (s.trim() === '' ? null : s.trim());
    const body = {
      name: f.name.trim(),
      company: blankToNull(f.company),
      phone: blankToNull(f.phone),
      email: blankToNull(f.email),
      area: blankToNull(f.area),
      commissionPct: Number(f.commissionPct),
      isActive: f.isActive,
      notes: blankToNull(f.notes),
    };
    this.saving.set(true);
    this.error.set(null);
    this.team.saveDealer(this.editing() || null, body as Partial<Dealer>).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.saving.set(false);
      },
    });
  }
}
