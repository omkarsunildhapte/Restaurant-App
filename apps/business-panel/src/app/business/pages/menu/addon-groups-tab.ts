import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { ToastService } from '../../../shared/ui/toast.service';
import { errorText, type DietType } from '../../data/db';
import { MenuService, type AddonGroup } from '../../data/menu.service';
import { WorkspaceStore } from '../../data/workspace.store';
import { DietMark, rupees } from '../../ui/diet-mark';
import { MenuStore } from './menu.store';

interface AddonDraft {
  id?: string;
  name: string;
  price: number | null;
  diet: DietType;
  is_available: boolean;
}

@Component({
  selector: 'bp-addon-groups-tab',
  imports: [FormsModule, ModalComponent, DietMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4 flex items-center justify-between gap-2">
      <p class="text-sm text-gray-500">Groups of extras (toppings, dips, milk) you can attach to any item.</p>
      @if (ws.canEditMenu()) {
        <button type="button" class="btn btn-primary px-4 py-2 text-sm" (click)="open(null)">Add group</button>
      }
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      @for (g of menu.addonGroups(); track g.id) {
        <section class="rounded-md border border-gray-200 p-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="font-medium text-gray-900">{{ g.name }}</h3>
              <p class="text-xs text-gray-500">{{ ruleText(g) }} · used by {{ usage().get(g.id) ?? 0 }} items</p>
            </div>
            @if (ws.canEditMenu()) {
              <div class="flex">
                <button type="button" class="btn btn-text px-3 py-1 text-sm" (click)="open(g)">Edit</button>
                <button type="button" class="btn btn-danger-text px-3 py-1 text-sm" (click)="remove(g)">Delete</button>
              </div>
            }
          </div>
          <ul class="mt-3 space-y-1 text-sm">
            @for (a of g.addons; track a.id) {
              <li class="flex items-center gap-2" [class.opacity-50]="!a.is_available">
                <bp-diet-mark [diet]="a.diet" />
                <span class="flex-1">{{ a.name }}</span>
                <span class="text-gray-600">{{ a.price > 0 ? '+' + rupees(a.price) : 'free' }}</span>
              </li>
            } @empty {
              <li class="text-gray-400">No options yet.</li>
            }
          </ul>
        </section>
      } @empty {
        <p class="p-6 text-center text-sm text-gray-500 md:col-span-2">{{ menu.loading() ? 'Loading…' : 'No add-on groups yet.' }}</p>
      }
    </div>

    <ui-modal [(visible)]="editing" [header]="editId() ? 'Edit add-on group' : 'Add add-on group'" width="40rem">
      <form id="addon-form" class="grid gap-4" (ngSubmit)="save()">
        <label class="block text-sm font-medium text-gray-700">
          Group name
          <input class="form-input mt-1 py-2" name="name" required [(ngModel)]="name" placeholder="Extra toppings" />
        </label>
        <div class="grid grid-cols-2 gap-4">
          <label class="block text-sm font-medium text-gray-700">
            Customer must pick at least
            <input class="form-input mt-1 py-2" type="number" min="0" name="min" [(ngModel)]="minSelect" />
          </label>
          <label class="block text-sm font-medium text-gray-700">
            and at most <span class="font-normal text-gray-400">(empty = any)</span>
            <input class="form-input mt-1 py-2" type="number" min="1" name="max" [(ngModel)]="maxSelect" />
          </label>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-700">Options</p>
          @for (a of addons(); track $index; let i = $index) {
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <input class="form-input flex-1 py-2" placeholder="Name" [attr.aria-label]="'Option ' + (i + 1) + ' name'" [name]="'aname' + i" [ngModel]="a.name" (ngModelChange)="setAddon(i, { name: $event })" />
              <input class="form-input w-28 py-2" type="number" min="0" step="0.5" placeholder="₹ extra" [attr.aria-label]="'Option ' + (i + 1) + ' price'" [name]="'aprice' + i" [ngModel]="a.price" (ngModelChange)="setAddon(i, { price: $event })" />
              <select class="form-input w-28 py-2" [attr.aria-label]="'Option ' + (i + 1) + ' type'" [name]="'adiet' + i" [ngModel]="a.diet" (ngModelChange)="setAddon(i, { diet: $event })">
                <option value="veg">Veg</option>
                <option value="egg">Egg</option>
                <option value="non_veg">Non-veg</option>
              </select>
              <label class="flex items-center gap-1 text-xs text-gray-600">
                <input type="checkbox" [name]="'aavail' + i" [ngModel]="a.is_available" (ngModelChange)="setAddon(i, { is_available: $event })" /> On
              </label>
              <button type="button" class="btn btn-danger-text px-2 py-2 text-sm" (click)="removeAddon(i)" [attr.aria-label]="'Remove option ' + (i + 1)">✕</button>
            </div>
          }
          <button type="button" class="btn btn-text mt-2 px-3 py-2 text-sm" (click)="addAddon()">Add option</button>
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
        <button type="submit" form="addon-form" class="btn btn-primary px-4 py-2 text-sm" [disabled]="busy() || !!problem()">
          {{ busy() ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </ui-modal>
  `,
})
export class AddonGroupsTab {
  protected readonly menu = inject(MenuStore);
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(MenuService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  protected readonly rupees = rupees;

  protected readonly editing = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly minSelect = signal<number | null>(0);
  protected readonly maxSelect = signal<number | null>(null);
  protected readonly addons = signal<AddonDraft[]>([]);
  protected readonly busy = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly usage = computed(() => {
    const counts = new Map<string, number>();
    for (const i of this.menu.items()) for (const l of i.item_addon_groups) counts.set(l.group_id, (counts.get(l.group_id) ?? 0) + 1);
    return counts;
  });

  protected ruleText(g: AddonGroup): string {
    if (g.min_select === 0 && g.max_select === null) return 'Optional, any number';
    if (g.min_select === 0) return `Optional, up to ${g.max_select}`;
    if (g.max_select === g.min_select) return `Pick exactly ${g.min_select}`;
    return `Pick ${g.min_select} to ${g.max_select ?? 'any'}`;
  }

  protected readonly problem = computed(() => {
    if (!this.name().trim()) return 'Give the group a name.';
    const min = Number(this.minSelect() ?? 0);
    const max = this.maxSelect() === null || (this.maxSelect() as unknown) === '' ? null : Number(this.maxSelect());
    if (min < 0 || (max !== null && max < Math.max(1, min))) return '"At most" must be at least "at least" (and at least 1).';
    if (this.addons().some((a) => !a.name.trim() || a.price === null || a.price < 0)) return 'Every option needs a name and a price (0 for free).';
    return null;
  });

  protected open(g: AddonGroup | null): void {
    this.editId.set(g?.id ?? null);
    this.name.set(g?.name ?? '');
    this.minSelect.set(g?.min_select ?? 0);
    this.maxSelect.set(g?.max_select ?? null);
    this.addons.set(
      g?.addons.map((a) => ({ id: a.id, name: a.name, price: Number(a.price), diet: a.diet, is_available: a.is_available })) ?? [
        { name: '', price: 0, diet: 'veg', is_available: true },
      ],
    );
    this.formError.set(null);
    this.editing.set(true);
  }

  protected addAddon(): void {
    this.addons.update((list) => [...list, { name: '', price: 0, diet: 'veg', is_available: true }]);
  }

  protected setAddon(index: number, change: Partial<AddonDraft>): void {
    this.addons.update((list) => list.map((a, i) => (i === index ? { ...a, ...change } : a)));
  }

  protected removeAddon(index: number): void {
    this.addons.update((list) => list.filter((_, i) => i !== index));
  }

  protected async save(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant || this.problem()) return;
    const max = this.maxSelect() === null || (this.maxSelect() as unknown) === '' ? null : Number(this.maxSelect());
    this.busy.set(true);
    this.formError.set(null);
    try {
      await this.api.saveAddonGroup(tenant, this.editId(), {
        name: this.name(),
        min_select: Number(this.minSelect() ?? 0),
        max_select: max,
        addons: this.addons().map((a) => ({ ...a, price: a.price ?? 0 })),
      });
      this.editing.set(false);
      await this.menu.load();
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(g: AddonGroup): Promise<void> {
    const used = this.usage().get(g.id) ?? 0;
    const ok = await this.confirm.confirm({
      header: 'Delete add-on group',
      message: used ? `"${g.name}" is used by ${used} items. Deleting it removes it from them. Continue?` : `Delete "${g.name}"?`,
      icon: 'warning',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptVariant: 'danger',
    });
    if (!ok) return;
    try {
      await this.api.deleteAddonGroup(g.id);
      await this.menu.load();
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }
}
