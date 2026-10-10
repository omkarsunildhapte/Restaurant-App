import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { errorText } from '../../data/db';
import { OrdersService, type OrderDetail, type OrderRow, type OrderStatus } from '../../data/orders.service';
import { WorkspaceStore } from '../../data/workspace.store';
import { rupees } from '../../ui/diet-mark';

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const TYPE_LABEL: Record<string, string> = { dine_in: 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' };

function isoDate(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

/** Past and current orders with their bill, for owners and managers. */
@Component({
  selector: 'bp-orders-page',
  imports: [FormsModule, ModalComponent],
  templateUrl: './orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(OrdersService);

  protected readonly from = signal(isoDate(new Date(Date.now() - 6 * 86_400_000)));
  protected readonly to = signal(isoDate(new Date()));
  protected readonly outlet = signal('');
  protected readonly status = signal<OrderStatus | ''>('');

  protected readonly orders = signal<OrderRow[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly open = signal(false);
  protected readonly detail = signal<OrderDetail | null>(null);
  protected readonly detailError = signal<string | null>(null);

  protected readonly statuses = Object.keys(STATUS_LABEL) as OrderStatus[];
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly typeLabel = TYPE_LABEL;
  protected readonly rupees = rupees;

  protected readonly allOutlets = computed(() => this.ws.current()?.outlet_id === null);
  protected readonly outletName = computed(() => {
    const names = new Map(this.ws.outlets().map((o) => [o.id, o.name]));
    return (id: string) => names.get(id) ?? '';
  });

  protected readonly totals = computed(() => {
    const live = this.orders().filter((o) => o.status !== 'cancelled');
    return { count: live.length, sum: live.reduce((s, o) => s + Number(o.total), 0) };
  });

  public ngOnInit(): void {
    if (!this.allOutlets()) this.outlet.set(this.ws.current()?.outlet_id ?? '');
    void this.load();
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
      this.orders.set(
        await this.api.list(tenant, { from: this.from(), to: this.to(), outletId: this.outlet() || null, status: this.status() }),
      );
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected liveBill(o: OrderRow) {
    return o.bills.find((b) => !b.is_void) ?? null;
  }

  protected statusClass(s: OrderStatus): string {
    const base = 'rounded-full px-2 py-0.5 text-xs font-medium ';
    if (s === 'cancelled') return base + 'bg-gray-100 text-gray-500';
    if (s === 'served' || s === 'delivered') return base + 'bg-green-100 text-green-800';
    return base + 'bg-amber-100 text-amber-800';
  }

  protected time(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  protected addonText(addons: unknown): string {
    return Array.isArray(addons) ? addons.map((a) => (a as { name?: string }).name).filter(Boolean).join(', ') : '';
  }

  protected async show(o: OrderRow): Promise<void> {
    this.detail.set(null);
    this.detailError.set(null);
    this.open.set(true);
    try {
      this.detail.set(await this.api.detail(o.id));
    } catch (e) {
      this.detailError.set(errorText(e));
    }
  }
}
