import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { ToastService } from '../../../shared/ui/toast.service';
import { errorText, type DietType } from '../../data/db';
import { MenuService, type MenuItem } from '../../data/menu.service';
import { WorkspaceStore } from '../../data/workspace.store';
import { DIET_LABEL, DietMark, rupees } from '../../ui/diet-mark';
import { MenuStore } from './menu.store';

interface Draft {
  id: string | null;
  category_id: string;
  name: string;
  description: string;
  diet: DietType;
  price: number | null;
  tax_rate_id: string;
  image_url: string | null;
  is_available: boolean;
  variants: { id?: string; name: string; price: number | null }[];
  addon_group_ids: string[];
}

@Component({
  selector: 'bp-items-tab',
  imports: [FormsModule, ModalComponent, DietMark],
  templateUrl: './items-tab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsTab {
  protected readonly menu = inject(MenuStore);
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(MenuService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly rupees = rupees;
  protected readonly diets: DietType[] = ['veg', 'egg', 'non_veg'];
  protected readonly dietLabel = DIET_LABEL;

  protected readonly search = signal('');
  protected readonly categoryFilter = signal('');

  protected readonly editing = signal(false);
  protected readonly draft = signal<Draft | null>(null);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly formError = signal<string | null>(null);

  /** Items grouped under their category, in menu order, after search and filter. */
  protected readonly groups = computed(() => {
    const q = this.search().trim().toLowerCase();
    const only = this.categoryFilter();
    const items = this.menu.items().filter(
      (i) => (!q || i.name.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q)) && (!only || i.category_id === only),
    );
    return this.menu
      .categories()
      .map((c) => ({ category: c, items: items.filter((i) => i.category_id === c.id) }))
      .filter((g) => g.items.length > 0);
  });

  protected priceText(item: MenuItem): string {
    if (!item.item_variants.length) return rupees(item.price);
    return item.item_variants.map((v) => `${v.name} ${rupees(v.price)}`).join(' · ');
  }

  protected addonNames(item: MenuItem): string {
    const byId = new Map(this.menu.addonGroups().map((g) => [g.id, g.name]));
    return item.item_addon_groups.map((l) => byId.get(l.group_id)).filter(Boolean).join(', ');
  }

  protected openNew(): void {
    const first = this.categoryFilter() || this.menu.categories()[0]?.id || '';
    this.open({
      id: null,
      category_id: first,
      name: '',
      description: '',
      diet: 'veg',
      price: null,
      tax_rate_id: '',
      image_url: null,
      is_available: true,
      variants: [],
      addon_group_ids: [],
    });
  }

  protected openEdit(item: MenuItem): void {
    this.open({
      id: item.id,
      category_id: item.category_id,
      name: item.name,
      description: item.description ?? '',
      diet: item.diet,
      price: Number(item.price),
      tax_rate_id: item.tax_rate_id ?? '',
      image_url: item.image_url,
      is_available: item.is_available,
      variants: item.item_variants.map((v) => ({ id: v.id, name: v.name, price: Number(v.price) })),
      addon_group_ids: item.item_addon_groups.map((l) => l.group_id),
    });
  }

  private open(d: Draft): void {
    this.draft.set(d);
    this.formError.set(null);
    this.editing.set(true);
  }

  protected patch(change: Partial<Draft>): void {
    this.draft.update((d) => (d ? { ...d, ...change } : d));
  }

  protected addVariant(): void {
    const d = this.draft();
    if (!d) return;
    // First size starts from the single price, so nothing typed is lost.
    const variants = d.variants.length ? [...d.variants, { name: '', price: null }] : [{ name: 'Regular', price: d.price }, { name: '', price: null }];
    this.patch({ variants });
  }

  protected setVariant(index: number, change: Partial<Draft['variants'][number]>): void {
    this.draft.update((d) => (d ? { ...d, variants: d.variants.map((v, i) => (i === index ? { ...v, ...change } : v)) } : d));
  }

  protected removeVariant(index: number): void {
    this.draft.update((d) => (d ? { ...d, variants: d.variants.filter((_, i) => i !== index) } : d));
  }

  protected toggleGroup(id: string, on: boolean): void {
    this.draft.update((d) =>
      d ? { ...d, addon_group_ids: on ? [...d.addon_group_ids, id] : d.addon_group_ids.filter((g) => g !== id) } : d,
    );
  }

  protected async onPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const tenant = this.ws.tenantId();
    if (!file || !tenant) return;
    this.uploading.set(true);
    this.formError.set(null);
    try {
      this.patch({ image_url: await this.api.uploadImage(tenant, file) });
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.uploading.set(false);
    }
  }

  /** Plain-language reason the form can't be saved yet, or null. */
  protected readonly problem = computed(() => {
    const d = this.draft();
    if (!d) return null;
    if (!d.name.trim()) return 'Give the item a name.';
    if (!d.category_id) return 'Choose a category.';
    if (d.variants.length) {
      if (d.variants.some((v) => !v.name.trim() || v.price === null || v.price < 0)) return 'Every size needs a name and a price.';
      const names = d.variants.map((v) => v.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) return 'Two sizes have the same name.';
    } else if (d.price === null || d.price < 0) {
      return 'Enter a price.';
    }
    return null;
  });

  protected async save(): Promise<void> {
    const d = this.draft();
    const tenant = this.ws.tenantId();
    if (!d || !tenant || this.problem()) return;
    this.saving.set(true);
    this.formError.set(null);
    try {
      await this.api.saveItem(tenant, d.id, {
        category_id: d.category_id,
        name: d.name,
        description: d.description,
        diet: d.diet,
        price: d.price ?? 0,
        tax_rate_id: d.tax_rate_id || null,
        image_url: d.image_url,
        is_available: d.is_available,
        variants: d.variants.map((v) => ({ id: v.id, name: v.name, price: v.price ?? 0 })),
        addon_group_ids: d.addon_group_ids,
      });
      this.editing.set(false);
      this.toast.success(`${d.name.trim()} saved.`);
      await this.menu.load();
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.saving.set(false);
    }
  }

  protected async toggleAvailable(item: MenuItem): Promise<void> {
    try {
      await this.api.setAvailable('menu_items', item.id, !item.is_available);
      this.menu.items.update((list) => list.map((i) => (i.id === item.id ? { ...i, is_available: !item.is_available } : i)));
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }

  protected async remove(item: MenuItem): Promise<void> {
    const ok = await this.confirm.confirm({
      header: 'Delete item',
      message: `Delete "${item.name}" from the menu? Past orders keep their copy of it.`,
      icon: 'warning',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptVariant: 'danger',
    });
    if (!ok) return;
    try {
      await this.api.deleteItem(item.id);
      this.toast.success(`${item.name} deleted.`);
      await this.menu.load();
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }
}
