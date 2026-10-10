import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { ToastService } from '../../../shared/ui/toast.service';
import { BusinessService, type DiningTable } from '../../data/business.service';
import { errorText } from '../../data/db';
import { WorkspaceStore } from '../../data/workspace.store';

/** Dining tables of the outlet in view, grouped by area. */
@Component({
  selector: 'bp-tables-page',
  imports: [FormsModule, ModalComponent],
  templateUrl: './tables-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablesPage {
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(BusinessService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly tables = signal<DiningTable[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly outletName = computed(() => this.ws.visibleOutlets().find((o) => o.id === this.ws.outletId())?.name ?? '');

  protected readonly areas = computed(() => {
    const groups = new Map<string, DiningTable[]>();
    for (const t of this.tables()) {
      const key = t.area ?? '';
      groups.set(key, [...(groups.get(key) ?? []), t]);
    }
    return [...groups.entries()].map(([area, tables]) => ({ area, tables }));
  });

  protected readonly seatTotal = computed(() => this.tables().filter((t) => t.is_active).reduce((s, t) => s + t.seats, 0));
  protected readonly areaNames = computed(() => [...new Set(this.tables().map((t) => t.area).filter((a): a is string => !!a))]);

  // One table
  protected readonly editing = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly seats = signal<number | null>(4);
  protected readonly area = signal('');
  protected readonly active = signal(true);

  // Several at once
  protected readonly adding = signal(false);
  protected readonly prefix = signal('T');
  protected readonly from = signal<number | null>(1);
  protected readonly to = signal<number | null>(8);
  protected readonly bulkSeats = signal<number | null>(4);
  protected readonly bulkArea = signal('');

  protected readonly busy = signal(false);
  protected readonly formError = signal<string | null>(null);

  constructor() {
    // Reload when the outlet picker changes.
    effect(() => {
      const outlet = this.ws.outletId();
      untracked(() => void this.load(outlet));
    });
  }

  protected async load(outlet = this.ws.outletId()): Promise<void> {
    if (!outlet) {
      this.tables.set([]);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      this.tables.set(await this.api.tables(outlet));
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected open(t: DiningTable | null): void {
    this.editId.set(t?.id ?? null);
    this.name.set(t?.name ?? '');
    this.seats.set(t?.seats ?? 4);
    this.area.set(t?.area ?? '');
    this.active.set(t?.is_active ?? true);
    this.formError.set(null);
    this.editing.set(true);
  }

  protected async save(): Promise<void> {
    const tenant = this.ws.tenantId();
    const outlet = this.ws.outletId();
    const seats = Number(this.seats());
    if (!tenant || !outlet) return;
    if (!this.name().trim() || !(seats >= 1 && seats <= 50)) {
      this.formError.set('Enter a table name and 1 to 50 seats.');
      return;
    }
    this.busy.set(true);
    this.formError.set(null);
    try {
      await this.api.saveTable(tenant, outlet, this.editId(), { name: this.name(), seats, area: this.area(), is_active: this.active() });
      this.editing.set(false);
      await this.load();
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected openBulk(): void {
    const last = Math.max(0, ...this.tables().map((t) => Number(t.name.match(/(\d+)$/)?.[1] ?? 0)));
    this.from.set(last + 1);
    this.to.set(last + 8);
    this.formError.set(null);
    this.adding.set(true);
  }

  protected async saveBulk(): Promise<void> {
    const tenant = this.ws.tenantId();
    const outlet = this.ws.outletId();
    const from = Number(this.from());
    const to = Number(this.to());
    const seats = Number(this.bulkSeats());
    if (!tenant || !outlet) return;
    if (!(from >= 0 && to >= from && to - from < 100 && seats >= 1 && seats <= 50)) {
      this.formError.set('Numbers must run upwards (at most 100 tables at once) and seats must be 1 to 50.');
      return;
    }
    this.busy.set(true);
    this.formError.set(null);
    try {
      const added = await this.api.addTables(tenant, outlet, this.prefix().trim(), from, to, seats, this.bulkArea());
      this.adding.set(false);
      this.toast.success(added ? `${added} tables added.` : 'Those tables already exist.');
      await this.load();
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(t: DiningTable): Promise<void> {
    const ok = await this.confirm.confirm({
      header: 'Delete table',
      message: `Delete table ${t.name}? Past orders on it stay, without a table. To stop using it for now, edit it and untick "In use".`,
      icon: 'warning',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptVariant: 'danger',
    });
    if (!ok) return;
    try {
      await this.api.deleteTable(t.id);
      await this.load();
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }
}
