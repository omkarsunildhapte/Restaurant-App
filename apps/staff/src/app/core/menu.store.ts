import { Injectable, computed, inject, signal } from '@angular/core';
import { db } from '@app/core/supabase.client';
import { SessionStore } from '@app/core/session.store';
import { Outbox } from '@app/core/outbox';
import type { Menu, MenuItem } from '@app/core/models';

const EMPTY: Menu = { categories: [], items: [], variants: [], groups: [], addons: [], itemGroups: {}, taxRates: {}, defaultTaxRate: 0, pricesIncludeTax: false, roundOff: false, packagingCharge: 0, ownerPhone: null };
const cacheKey = (tenant: string) => 'rp-staff.menu.' + tenant;

/**
 * The business's menu, shared by every outlet. Kept on the device as well, so the waiter app
 * and the POS still show the menu when the internet drops (offline mode).
 */
@Injectable({ providedIn: 'root' })
export class MenuStore {
  private readonly session = inject(SessionStore);
  private readonly outbox = inject(Outbox);

  private readonly _menu = signal<Menu>(EMPTY);
  private readonly _error = signal<string | null>(null);
  private readonly _fromCache = signal(false);

  readonly menu = this._menu.asReadonly();
  readonly error = this._error.asReadonly();
  readonly fromCache = this._fromCache.asReadonly();

  readonly itemsByCategory = computed(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of this._menu().items) {
      const list = map.get(item.category_id) ?? [];
      list.push(item);
      map.set(item.category_id, list);
    }
    return map;
  });

  public async load(): Promise<void> {
    const tenant = this.session.workspace()?.tenant_id;
    if (!tenant) return;
    if (!this._menu().items.length) this.restore(tenant);
    try {
      const c = db();
      const [cats, items, variants, groups, addons, links, rates, settings] = await Promise.all([
        c.from('menu_categories').select('id, name, kind, sort_order').eq('tenant_id', tenant).eq('is_active', true).order('sort_order'),
        c.from('menu_items').select('id, category_id, tax_rate_id, name, description, diet, price, is_available, sort_order').eq('tenant_id', tenant).order('sort_order'),
        c.from('item_variants').select('id, item_id, name, price').eq('tenant_id', tenant).order('sort_order'),
        c.from('addon_groups').select('id, name, min_select, max_select').eq('tenant_id', tenant),
        c.from('addons').select('id, group_id, name, price, diet, is_available').eq('tenant_id', tenant).order('sort_order'),
        c.from('item_addon_groups').select('item_id, group_id, sort_order').eq('tenant_id', tenant).order('sort_order'),
        c.from('tax_rates').select('id, rate, is_default').eq('tenant_id', tenant),
        c.from('tenants').select('prices_include_tax, round_off, packaging_charge, phone').eq('id', tenant).single(),
      ]);
      const failed = [cats, items, variants, groups, addons, links, rates, settings].find((r) => r.error);
      if (failed?.error) throw new Error(failed.error.message);
      const itemGroups: Record<string, string[]> = {};
      for (const l of (links.data ?? []) as { item_id: string; group_id: string }[]) {
        (itemGroups[l.item_id] ??= []).push(l.group_id);
      }
      const menu: Menu = {
        categories: cats.data ?? [],
        items: items.data ?? [],
        variants: variants.data ?? [],
        groups: groups.data ?? [],
        addons: addons.data ?? [],
        itemGroups,
        taxRates: Object.fromEntries(((rates.data ?? []) as { id: string; rate: number }[]).map((r) => [r.id, Number(r.rate)])),
        defaultTaxRate: Number(((rates.data ?? []) as { rate: number; is_default: boolean }[]).find((r) => r.is_default)?.rate ?? 0),
        pricesIncludeTax: !!(settings.data as { prices_include_tax: boolean } | null)?.prices_include_tax,
        roundOff: (settings.data as { round_off?: boolean } | null)?.round_off ?? false,
        packagingCharge: Number((settings.data as { packaging_charge?: number } | null)?.packaging_charge ?? 0),
        ownerPhone: (settings.data as { phone?: string | null } | null)?.phone ?? null,
      };
      this._menu.set(menu);
      this._fromCache.set(false);
      this._error.set(null);
      try {
        localStorage.setItem(cacheKey(tenant), JSON.stringify(menu));
      } catch {
        /* no offline copy; the live menu still works */
      }
    } catch (e) {
      // Offline or server down: keep the copy on the device if there is one.
      if (this._menu().items.length) this._fromCache.set(true);
      else this._error.set((e as Error).message);
    }
  }

  /**
   * Sold out / back on (cashier, kitchen, manager): applied here at once so waiters stop
   * offering it, and sent through the outbox (supabase set_item_available). The menu is
   * business-wide, so this applies at every outlet.
   */
  public async setAvailable(itemId: string, available: boolean): Promise<void> {
    const tenant = this.session.workspace()?.tenant_id;
    this._menu.update((m) => ({ ...m, items: m.items.map((i) => (i.id === itemId ? { ...i, is_available: available } : i)) }));
    if (tenant) {
      try {
        localStorage.setItem(cacheKey(tenant), JSON.stringify(this._menu()));
      } catch {
        /* no offline copy */
      }
    }
    const name = this._menu().items.find((i) => i.id === itemId)?.name ?? 'Dish';
    await this.outbox.send({ kind: 'rpc', fn: 'set_item_available', args: { p_item: itemId, p_available: available } }, `${name} ${available ? 'back on' : 'sold out'}`);
  }

  /** The GST % the database will apply to this item (its own rate, else the business default). */
  public taxRateOf(item: { tax_rate_id: string | null }): number {
    const m = this._menu();
    return item.tax_rate_id && item.tax_rate_id in m.taxRates ? m.taxRates[item.tax_rate_id]! : m.defaultTaxRate;
  }

  public variantsOf(itemId: string) {
    return this._menu().variants.filter((v) => v.item_id === itemId);
  }

  public groupsOf(itemId: string) {
    const ids = this._menu().itemGroups[itemId] ?? [];
    return ids
      .map((id) => this._menu().groups.find((g) => g.id === id))
      .filter((g): g is NonNullable<typeof g> => !!g)
      .map((g) => ({ ...g, addons: this._menu().addons.filter((a) => a.group_id === g.id && a.is_available) }));
  }

  private restore(tenant: string): void {
    try {
      const raw = localStorage.getItem(cacheKey(tenant));
      if (raw) {
        this._menu.set(JSON.parse(raw) as Menu);
        this._fromCache.set(true);
      }
    } catch {
      /* nothing cached */
    }
  }
}
