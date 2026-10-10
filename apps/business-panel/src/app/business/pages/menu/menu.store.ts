import { Injectable, computed, inject, signal } from '@angular/core';
import { errorText } from '../../data/db';
import { MenuService, type AddonGroup, type Category, type Combo, type MenuItem, type TaxRate } from '../../data/menu.service';
import { WorkspaceStore } from '../../data/workspace.store';

/** Everything on the Menu screen, loaded together. Provided by MenuPage, shared by its tabs. */
@Injectable()
export class MenuStore {
  private readonly api = inject(MenuService);
  private readonly ws = inject(WorkspaceStore);

  readonly categories = signal<Category[]>([]);
  readonly items = signal<MenuItem[]>([]);
  readonly addonGroups = signal<AddonGroup[]>([]);
  readonly combos = signal<Combo[]>([]);
  readonly taxRates = signal<TaxRate[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  readonly defaultTax = computed(() => this.taxRates().find((r) => r.is_default) ?? null);
  readonly taxById = computed(() => new Map(this.taxRates().map((r) => [r.id, r])));
  readonly categoryById = computed(() => new Map(this.categories().map((c) => [c.id, c])));
  readonly itemById = computed(() => new Map(this.items().map((i) => [i.id, i])));
  readonly itemCountByCategory = computed(() => {
    const counts = new Map<string, number>();
    for (const i of this.items()) counts.set(i.category_id, (counts.get(i.category_id) ?? 0) + 1);
    return counts;
  });

  async load(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const [categories, items, addonGroups, combos, taxRates] = await Promise.all([
        this.api.categories(tenant),
        this.api.items(tenant),
        this.api.addonGroups(tenant),
        this.api.combos(tenant),
        this.api.taxRates(tenant),
      ]);
      for (const i of items) i.item_variants.sort((a, b) => a.sort_order - b.sort_order);
      this.categories.set(categories);
      this.items.set(items);
      this.addonGroups.set(addonGroups);
      this.combos.set(combos);
      this.taxRates.set(taxRates);
      this.loaded.set(true);
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }

  /** GST label for an item or combo: its own rate, or the business default. */
  taxLabel(taxRateId: string | null): string {
    const rate = taxRateId ? this.taxById().get(taxRateId) : this.defaultTax();
    return rate ? `${Number(rate.rate)}%` + (taxRateId ? '' : ' (default)') : '—';
  }
}
