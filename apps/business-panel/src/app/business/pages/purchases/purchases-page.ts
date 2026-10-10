import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { TabPanelComponent, TabsComponent } from '../../../shared/ui/tabs.component';
import { ToastService } from '../../../shared/ui/toast.service';
import { errorText } from '../../data/db';
import {
  ExpensesService,
  type ExpenseMode,
  type ItemSuggestion,
  type Purchase,
  type PurchaseSummary,
  type PurchaseUnit,
  type Vendor,
} from '../../data/expenses.service';
import { WorkspaceStore } from '../../data/workspace.store';
import { downloadCsv } from '../../ui/csv';
import { rupees } from '../../ui/diet-mark';

export const MODE_LABEL: Record<ExpenseMode, string> = { cash: 'Cash', upi: 'UPI', card: 'Card', bank: 'Bank', credit: 'Credit (unpaid)' };
const UNITS: PurchaseUnit[] = ['kg', 'g', 'l', 'ml', 'pcs', 'pack', 'dozen', 'box', 'bag'];

interface Line {
  item_name: string;
  quantity: number | null;
  unit: PurchaseUnit;
  rate: number | null;
}

function isoDate(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

const blankLine = (): Line => ({ item_name: '', quantity: null, unit: 'kg', rate: null });

/** Daily purchases: record what was bought (works on a phone at the market), see it by day, item and vendor. */
@Component({
  selector: 'bp-purchases-page',
  imports: [FormsModule, ModalComponent, TabsComponent, TabPanelComponent],
  templateUrl: './purchases-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchasesPage implements OnInit {
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(ExpensesService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly rupees = rupees;
  protected readonly modeLabel = MODE_LABEL;
  protected readonly modes: ExpenseMode[] = ['cash', 'upi', 'card', 'bank', 'credit'];
  protected readonly units = UNITS;
  protected readonly tab = signal(0);

  // Filters
  protected readonly from = signal(isoDate(new Date(Date.now() - 6 * 86_400_000)));
  protected readonly to = signal(isoDate(new Date()));
  protected readonly outlet = signal('');
  protected readonly vendor = signal('');
  protected readonly mode = signal<ExpenseMode | ''>('');
  protected readonly unpaidOnly = signal(false);

  protected readonly purchases = signal<Purchase[]>([]);
  protected readonly summary = signal<PurchaseSummary | null>(null);
  protected readonly vendors = signal<Vendor[]>([]);
  protected readonly suggestions = signal<ItemSuggestion[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Add form
  protected readonly adding = signal(false);
  protected readonly fOutlet = signal('');
  protected readonly fDate = signal(isoDate(new Date()));
  protected readonly fVendor = signal('');
  protected readonly fMode = signal<ExpenseMode>('cash');
  protected readonly fGst = signal<number | null>(null);
  protected readonly fNotes = signal('');
  protected readonly fBill = signal<string | null>(null);
  protected readonly lines = signal<Line[]>([blankLine()]);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly formError = signal<string | null>(null);

  // Mark paid
  protected readonly paying = signal<Purchase | null>(null);
  protected readonly payMode = signal<ExpenseMode>('cash');

  protected readonly allOutlets = computed(() => this.ws.current()?.outlet_id === null);
  protected readonly outletName = computed(() => {
    const names = new Map(this.ws.outlets().map((o) => [o.id, o.name]));
    return (id: string) => names.get(id) ?? '';
  });

  protected readonly days = computed(() => {
    const groups = new Map<string, Purchase[]>();
    for (const p of this.purchases()) groups.set(p.purchase_date, [...(groups.get(p.purchase_date) ?? []), p]);
    return [...groups.entries()].map(([day, list]) => ({ day, list, total: list.reduce((s, p) => s + Number(p.total), 0) }));
  });

  protected readonly shownTotal = computed(() => this.purchases().reduce((s, p) => s + Number(p.total), 0));
  protected readonly shownUnpaid = computed(() => this.purchases().filter((p) => !p.paid_at).reduce((s, p) => s + Number(p.total), 0));

  protected readonly formSubtotal = computed(() =>
    this.lines().reduce((s, l) => s + Math.round((Number(l.quantity) || 0) * (Number(l.rate) || 0) * 100) / 100, 0),
  );
  protected readonly formTotal = computed(() => this.formSubtotal() + (Number(this.fGst()) || 0));
  protected readonly formProblem = computed(() => {
    const filled = this.lines().filter((l) => l.item_name.trim() || l.quantity || l.rate);
    if (!filled.length) return 'Add at least one item.';
    if (filled.some((l) => !l.item_name.trim() || !(Number(l.quantity) > 0) || l.rate === null || Number(l.rate) < 0))
      return 'Every line needs an item, a quantity and a rate.';
    if (!this.fOutlet()) return 'Choose the outlet.';
    return null;
  });

  public ngOnInit(): void {
    if (!this.allOutlets()) this.outlet.set(this.ws.current()?.outlet_id ?? '');
    void this.load();
    void this.loadLists();
  }

  protected async load(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    if (this.from() > this.to()) {
      this.error.set('"From" is after "To".');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const [rows, summary] = await Promise.all([
        this.api.purchases(tenant, {
          from: this.from(),
          to: this.to(),
          outletId: this.outlet() || null,
          vendor: this.vendor(),
          mode: this.mode(),
          unpaidOnly: this.unpaidOnly(),
        }),
        this.api.summary(tenant, this.from(), this.to(), this.outlet() || null),
      ]);
      this.purchases.set(rows);
      this.summary.set(summary);
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }

  private async loadLists(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    try {
      const [vendors, suggestions] = await Promise.all([this.api.vendors(tenant), this.api.itemSuggestions(tenant)]);
      this.vendors.set(vendors);
      this.suggestions.set(suggestions);
    } catch {
      /* suggestions are a convenience */
    }
  }

  protected openAdd(): void {
    this.fOutlet.set(this.outlet() || this.ws.outletId() || this.ws.visibleOutlets()[0]?.id || '');
    this.fDate.set(isoDate(new Date()));
    this.fVendor.set('');
    this.fMode.set('cash');
    this.fGst.set(null);
    this.fNotes.set('');
    this.fBill.set(null);
    this.lines.set([blankLine(), blankLine()]);
    this.formError.set(null);
    this.adding.set(true);
  }

  protected setLine(i: number, change: Partial<Line>): void {
    this.lines.update((list) => list.map((l, n) => (n === i ? { ...l, ...change } : l)));
  }

  /** Picking a known item fills its last unit and rate. */
  protected onItemName(i: number, name: string): void {
    const known = this.suggestions().find((s) => s.item_name.toLowerCase() === name.trim().toLowerCase());
    const line = this.lines()[i];
    this.setLine(i, known && line && line.rate === null ? { item_name: name, unit: known.unit, rate: known.rate } : { item_name: name });
  }

  protected addLine(): void {
    this.lines.update((l) => [...l, blankLine()]);
  }

  protected removeLine(i: number): void {
    this.lines.update((l) => (l.length > 1 ? l.filter((_, n) => n !== i) : [blankLine()]));
  }

  protected lineAmount(l: Line): number {
    return Math.round((Number(l.quantity) || 0) * (Number(l.rate) || 0) * 100) / 100;
  }

  protected async onBill(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const tenant = this.ws.tenantId();
    if (!file || !tenant) return;
    this.uploading.set(true);
    this.formError.set(null);
    try {
      this.fBill.set(await this.api.uploadBill(tenant, file));
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.uploading.set(false);
    }
  }

  protected async save(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant || this.formProblem()) return;
    this.saving.set(true);
    this.formError.set(null);
    try {
      await this.api.addPurchase(tenant, {
        outlet_id: this.fOutlet(),
        purchase_date: this.fDate(),
        vendor_name: this.fVendor(),
        gst_amount: Number(this.fGst()) || 0,
        payment_mode: this.fMode(),
        notes: this.fNotes(),
        bill_path: this.fBill(),
        items: this.lines()
          .filter((l) => l.item_name.trim())
          .map((l) => ({ item_name: l.item_name, quantity: Number(l.quantity), unit: l.unit, rate: Number(l.rate) })),
      });
      this.adding.set(false);
      this.toast.success(`Purchase of ${rupees(this.formTotal())} saved.`);
      await Promise.all([this.load(), this.loadLists()]);
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.saving.set(false);
    }
  }

  protected openPay(p: Purchase): void {
    this.payMode.set('cash');
    this.paying.set(p);
  }

  protected onPayVisible(open: boolean): void {
    if (!open) this.paying.set(null);
  }

  protected async markPaid(): Promise<void> {
    const p = this.paying();
    if (!p) return;
    try {
      await this.api.markPaid(p.id, this.payMode());
      this.paying.set(null);
      this.toast.success(`Marked paid (${MODE_LABEL[this.payMode()]}).`);
      await this.load();
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }

  protected async remove(p: Purchase): Promise<void> {
    const ok = await this.confirm.confirm({
      header: 'Delete purchase',
      message: `Delete this ${rupees(p.total)} purchase${p.vendor_name ? ' from ' + p.vendor_name : ''}?`,
      icon: 'warning',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptVariant: 'danger',
    });
    if (!ok) return;
    try {
      await this.api.deletePurchase(p.id);
      await this.load();
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }

  protected async openBill(p: Purchase): Promise<void> {
    if (!p.bill_path) return;
    try {
      window.open(await this.api.billUrl(p.bill_path), '_blank', 'noopener');
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }

  protected itemsText(p: Purchase): string {
    return p.purchase_items.map((i) => `${i.item_name} ${Number(i.quantity)} ${i.unit}`).join(', ');
  }

  protected dayLabel(day: string): string {
    return new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  protected exportPurchases(): void {
    const rows = this.purchases().flatMap((p) =>
      p.purchase_items.map((i) => [
        p.purchase_date,
        this.outletName()(p.outlet_id),
        p.vendor_name ?? '',
        i.item_name,
        Number(i.quantity),
        i.unit,
        Number(i.rate),
        Number(i.amount),
        MODE_LABEL[p.payment_mode],
        p.paid_at ? 'Yes' : 'No',
      ]),
    );
    downloadCsv(`purchases-${this.from()}-to-${this.to()}.csv`, ['Date', 'Outlet', 'Vendor', 'Item', 'Quantity', 'Unit', 'Rate', 'Amount', 'Payment', 'Paid'], rows);
  }

  protected exportSummary(): void {
    const s = this.summary();
    if (!s) return;
    downloadCsv(
      `purchases-by-item-${this.from()}-to-${this.to()}.csv`,
      ['Item', 'Unit', 'Quantity', 'Amount', 'Average rate'],
      s.byItem.map((i) => [i.item, i.unit, Number(i.quantity), Number(i.amount), Number(i.average_rate)]),
    );
  }
}
