import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { ToastService } from '../../../shared/ui/toast.service';
import { errorText } from '../../data/db';
import { MenuService, type Combo } from '../../data/menu.service';
import { WorkspaceStore } from '../../data/workspace.store';
import { rupees } from '../../ui/diet-mark';
import { MenuStore } from './menu.store';

interface Line {
  item_id: string;
  variant_id: string;
  quantity: number;
}

@Component({
  selector: 'bp-combos-tab',
  imports: [FormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4 flex items-center justify-between gap-2">
      <p class="text-sm text-gray-500">Meals sold at one price, e.g. "Breakfast Combo: eggs + cappuccino".</p>
      @if (ws.canEditMenu()) {
        <button type="button" class="btn btn-primary px-4 py-2 text-sm" (click)="open(null)" [disabled]="!menu.items().length">Add combo</button>
      }
    </div>

    <ul class="divide-y divide-gray-100 rounded-md border border-gray-200">
      @for (c of menu.combos(); track c.id) {
        <li class="flex flex-wrap items-center gap-3 px-3 py-3" [class.opacity-60]="!c.is_available">
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900">{{ c.name }} <span class="ml-1 text-sm font-normal text-gray-600">{{ rupees(c.price) }}</span></p>
            <p class="text-sm text-gray-600">{{ contents(c) }}</p>
            <p class="text-xs text-gray-400">
              GST {{ menu.taxLabel(c.tax_rate_id) }}
              @if (worth(c) > c.price) { · saves {{ rupees(worth(c) - c.price) }} on {{ rupees(worth(c)) }} }
            </p>
          </div>
          @if (ws.canEditMenu()) {
            <label class="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" class="h-4 w-4" [checked]="c.is_available" (change)="toggle(c)" /> Available
            </label>
            <button type="button" class="btn btn-text px-3 py-2 text-sm" (click)="open(c)">Edit</button>
            <button type="button" class="btn btn-danger-text px-3 py-2 text-sm" (click)="remove(c)">Delete</button>
          }
        </li>
      } @empty {
        <li class="p-6 text-center text-sm text-gray-500">{{ menu.loading() ? 'Loading…' : 'No combos yet.' }}</li>
      }
    </ul>

    <ui-modal [(visible)]="editing" [header]="editId() ? 'Edit combo' : 'Add combo'" width="42rem">
      <form id="combo-form" class="grid gap-4" (ngSubmit)="save()">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm font-medium text-gray-700">
            Name
            <input class="form-input mt-1 py-2" name="name" required [(ngModel)]="name" />
          </label>
          <label class="block text-sm font-medium text-gray-700">
            Combo price (₹)
            <input class="form-input mt-1 py-2" type="number" min="0" step="0.5" name="price" [(ngModel)]="price" />
          </label>
        </div>
        <label class="block text-sm font-medium text-gray-700">
          Description <span class="font-normal text-gray-400">(optional)</span>
          <input class="form-input mt-1 py-2" name="description" [(ngModel)]="description" />
        </label>

        <div>
          <p class="text-sm font-medium text-gray-700">What's in it</p>
          @for (l of lines(); track $index; let i = $index) {
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <select class="form-input min-w-40 flex-1 py-2" [attr.aria-label]="'Item ' + (i + 1)" [name]="'item' + i" [ngModel]="l.item_id" (ngModelChange)="setLine(i, { item_id: $event, variant_id: '' })">
                @for (it of menu.items(); track it.id) {
                  <option [value]="it.id">{{ it.name }}</option>
                }
              </select>
              @if (variantsOf(l.item_id).length) {
                <select class="form-input w-36 py-2" [attr.aria-label]="'Size for item ' + (i + 1)" [name]="'variant' + i" [ngModel]="l.variant_id" (ngModelChange)="setLine(i, { variant_id: $event })">
                  <option value="">Any size</option>
                  @for (v of variantsOf(l.item_id); track v.id) {
                    <option [value]="v.id">{{ v.name }}</option>
                  }
                </select>
              }
              <input class="form-input w-20 py-2" type="number" min="1" [attr.aria-label]="'Quantity of item ' + (i + 1)" [name]="'qty' + i" [ngModel]="l.quantity" (ngModelChange)="setLine(i, { quantity: $event })" />
              <button type="button" class="btn btn-danger-text px-2 py-2 text-sm" (click)="removeLine(i)" [attr.aria-label]="'Remove item ' + (i + 1)">✕</button>
            </div>
          }
          <button type="button" class="btn btn-text mt-2 px-3 py-2 text-sm" (click)="addLine()">Add item</button>
          @if (draftWorth() > 0) {
            <p class="mt-1 text-xs text-gray-500">Bought separately: {{ rupees(draftWorth()) }}</p>
          }
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm font-medium text-gray-700">
            GST
            <select class="form-input mt-1 py-2" name="tax" [(ngModel)]="taxRateId">
              <option value="">Business default</option>
              @for (r of menu.taxRates(); track r.id) {
                <option [value]="r.id">{{ r.name }}</option>
              }
            </select>
          </label>
          <label class="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
            <input type="checkbox" class="h-4 w-4" name="available" [(ngModel)]="available" /> Available to order
          </label>
        </div>
        @if (formError()) {
          <p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{{ formError() }}</p>
        }
      </form>
      <div uiModalFooter class="flex flex-wrap items-center justify-end gap-3 rounded-b-md border-t border-gray-100 bg-gray-50 px-6 py-4">
        @if (problem(); as p) {
          <span class="mr-auto text-sm text-gray-500">{{ p }}</span>
        }
        <button type="button" class="btn border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300" (click)="editing.set(false)">Cancel</button>
        <button type="submit" form="combo-form" class="btn btn-primary px-4 py-2 text-sm" [disabled]="busy() || !!problem()">
          {{ busy() ? 'Saving…' : 'Save combo' }}
        </button>
      </div>
    </ui-modal>
  `,
})
export class CombosTab {
  protected readonly menu = inject(MenuStore);
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(MenuService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  protected readonly rupees = rupees;

  protected readonly editing = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly price = signal<number | null>(null);
  protected readonly taxRateId = signal('');
  protected readonly available = signal(true);
  private imageUrl: string | null = null;
  protected readonly lines = signal<Line[]>([]);
  protected readonly busy = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected variantsOf(itemId: string) {
    return this.menu.itemById().get(itemId)?.item_variants ?? [];
  }

  private lineValue(itemId: string, variantId: string | null, quantity: number): number {
    const item = this.menu.itemById().get(itemId);
    if (!item) return 0;
    const v = variantId ? item.item_variants.find((x) => x.id === variantId) : null;
    return Number(v?.price ?? item.price) * quantity;
  }

  /** Price of the contents bought separately. */
  protected worth(c: Combo): number {
    return c.combo_items.reduce((sum, ci) => sum + this.lineValue(ci.item_id, ci.variant_id, ci.quantity), 0);
  }

  protected readonly draftWorth = computed(() =>
    this.lines().reduce((sum, l) => sum + this.lineValue(l.item_id, l.variant_id || null, Number(l.quantity) || 0), 0),
  );

  protected contents(c: Combo): string {
    return c.combo_items
      .map((ci) => {
        const item = this.menu.itemById().get(ci.item_id);
        const v = ci.variant_id ? item?.item_variants.find((x) => x.id === ci.variant_id) : null;
        return `${ci.quantity > 1 ? ci.quantity + ' × ' : ''}${item?.name ?? 'Removed item'}${v ? ' (' + v.name + ')' : ''}`;
      })
      .join(' + ');
  }

  protected readonly problem = computed(() => {
    if (!this.name().trim()) return 'Give the combo a name.';
    if (this.price() === null || Number(this.price()) < 0) return 'Enter the combo price.';
    if (this.lines().length < 2 && !(this.lines().length === 1 && this.lines()[0]!.quantity > 1)) return 'A combo needs at least two items.';
    if (this.lines().some((l) => !l.item_id || !(Number(l.quantity) >= 1))) return 'Every line needs an item and a quantity.';
    return null;
  });

  protected open(c: Combo | null): void {
    this.editId.set(c?.id ?? null);
    this.name.set(c?.name ?? '');
    this.description.set(c?.description ?? '');
    this.price.set(c ? Number(c.price) : null);
    this.taxRateId.set(c?.tax_rate_id ?? '');
    this.available.set(c?.is_available ?? true);
    this.imageUrl = c?.image_url ?? null;
    const first = this.menu.items()[0]?.id ?? '';
    this.lines.set(
      c?.combo_items.map((ci) => ({ item_id: ci.item_id, variant_id: ci.variant_id ?? '', quantity: ci.quantity })) ?? [
        { item_id: first, variant_id: '', quantity: 1 },
        { item_id: first, variant_id: '', quantity: 1 },
      ],
    );
    this.formError.set(null);
    this.editing.set(true);
  }

  protected addLine(): void {
    this.lines.update((l) => [...l, { item_id: this.menu.items()[0]?.id ?? '', variant_id: '', quantity: 1 }]);
  }

  protected setLine(index: number, change: Partial<Line>): void {
    this.lines.update((list) => list.map((l, i) => (i === index ? { ...l, ...change } : l)));
  }

  protected removeLine(index: number): void {
    this.lines.update((list) => list.filter((_, i) => i !== index));
  }

  protected async save(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant || this.problem()) return;
    this.busy.set(true);
    this.formError.set(null);
    try {
      await this.api.saveCombo(tenant, this.editId(), {
        name: this.name(),
        description: this.description(),
        price: Number(this.price()),
        tax_rate_id: this.taxRateId() || null,
        image_url: this.imageUrl,
        is_available: this.available(),
        items: this.lines().map((l) => ({ item_id: l.item_id, variant_id: l.variant_id || null, quantity: Number(l.quantity) })),
      });
      this.editing.set(false);
      await this.menu.load();
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async toggle(c: Combo): Promise<void> {
    try {
      await this.api.setAvailable('combos', c.id, !c.is_available);
      this.menu.combos.update((list) => list.map((x) => (x.id === c.id ? { ...x, is_available: !c.is_available } : x)));
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }

  protected async remove(c: Combo): Promise<void> {
    const ok = await this.confirm.confirm({
      header: 'Delete combo',
      message: `Delete "${c.name}"?`,
      icon: 'warning',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptVariant: 'danger',
    });
    if (!ok) return;
    try {
      await this.api.deleteCombo(c.id);
      await this.menu.load();
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }
}
