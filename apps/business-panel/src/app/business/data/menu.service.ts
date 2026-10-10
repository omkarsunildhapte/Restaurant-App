import { Injectable, inject } from '@angular/core';
import { BusinessDb, unwrap, type DietType, type ItemKind, type Tables } from './db';

export type Category = Tables<'menu_categories'>;
export type TaxRate = Tables<'tax_rates'>;
export type Variant = Pick<Tables<'item_variants'>, 'id' | 'name' | 'price' | 'sort_order'>;
export type Addon = Tables<'addons'>;
export type AddonGroup = Tables<'addon_groups'> & { addons: Addon[] };

export interface MenuItem extends Tables<'menu_items'> {
  item_variants: Variant[];
  item_addon_groups: { group_id: string }[];
}

export interface ComboItem {
  id: string;
  item_id: string;
  variant_id: string | null;
  quantity: number;
}

export interface Combo extends Tables<'combos'> {
  combo_items: ComboItem[];
}

export interface ItemInput {
  category_id: string;
  name: string;
  description: string | null;
  diet: DietType;
  price: number;
  tax_rate_id: string | null;
  image_url: string | null;
  is_available: boolean;
  variants: { id?: string; name: string; price: number }[];
  addon_group_ids: string[];
}

export interface ComboInput {
  name: string;
  description: string | null;
  price: number;
  tax_rate_id: string | null;
  image_url: string | null;
  is_available: boolean;
  items: { item_id: string; variant_id: string | null; quantity: number }[];
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Menu for one business: shared by all its outlets. Writes are checked by RLS (admin/owner/manager). */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly db = inject(BusinessDb);

  // ---- Categories ---------------------------------------------------------------------------

  async categories(tenant: string): Promise<Category[]> {
    return unwrap(
      await this.db.client.from('menu_categories').select('*').eq('tenant_id', tenant).order('sort_order').order('name'),
    );
  }

  async saveCategory(tenant: string, id: string | null, input: { name: string; kind: ItemKind; is_active: boolean }) {
    const q = this.db.client.from('menu_categories');
    if (id) {
      unwrap(await q.update(input).eq('id', id));
    } else {
      const { data: last } = await q.select('sort_order').eq('tenant_id', tenant).order('sort_order', { ascending: false }).limit(1);
      unwrap(await q.insert({ ...input, tenant_id: tenant, sort_order: (last?.[0]?.sort_order ?? 0) + 1 }));
    }
  }

  async deleteCategory(id: string) {
    unwrap(await this.db.client.from('menu_categories').delete().eq('id', id));
  }

  /** Swap a category with its neighbour. */
  async moveCategory(list: Category[], index: number, step: -1 | 1) {
    const other = list[index + step];
    const current = list[index];
    if (!other || !current) return;
    const a = current.sort_order === other.sort_order ? index + 1 : current.sort_order;
    const b = current.sort_order === other.sort_order ? index + 1 + step : other.sort_order;
    const q = this.db.client.from('menu_categories');
    unwrap(await q.update({ sort_order: b }).eq('id', current.id));
    unwrap(await q.update({ sort_order: a }).eq('id', other.id));
  }

  // ---- Items --------------------------------------------------------------------------------

  async items(tenant: string): Promise<MenuItem[]> {
    return unwrap(
      await this.db.client
        .from('menu_items')
        .select('*, item_variants(id, name, price, sort_order), item_addon_groups(group_id)')
        .eq('tenant_id', tenant)
        .order('sort_order')
        .order('name'),
    ) as MenuItem[];
  }

  async saveItem(tenant: string, id: string | null, input: ItemInput): Promise<string> {
    const c = this.db.client;
    const columns = {
      category_id: input.category_id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      diet: input.diet,
      price: input.variants.length ? Math.min(...input.variants.map((v) => v.price)) : input.price,
      tax_rate_id: input.tax_rate_id,
      image_url: input.image_url,
      is_available: input.is_available,
    };

    let itemId = id;
    if (itemId) {
      unwrap(await c.from('menu_items').update(columns).eq('id', itemId));
    } else {
      const row = unwrap(await c.from('menu_items').insert({ ...columns, tenant_id: tenant }).select('id').single());
      itemId = row.id;
    }

    // Variants: update kept ones, add new ones, remove the rest.
    const existing = unwrap(await c.from('item_variants').select('id').eq('item_id', itemId));
    const keep = new Set(input.variants.filter((v) => v.id).map((v) => v.id));
    const removed = existing.filter((v) => !keep.has(v.id)).map((v) => v.id);
    if (removed.length) unwrap(await c.from('item_variants').delete().in('id', removed));
    for (const [i, v] of input.variants.entries()) {
      const row = { name: v.name.trim(), price: v.price, sort_order: i + 1 };
      if (v.id) unwrap(await c.from('item_variants').update(row).eq('id', v.id));
      else unwrap(await c.from('item_variants').insert({ ...row, item_id: itemId, tenant_id: tenant }));
    }

    // Add-on groups: replace the links.
    unwrap(await c.from('item_addon_groups').delete().eq('item_id', itemId));
    if (input.addon_group_ids.length) {
      unwrap(
        await c.from('item_addon_groups').insert(
          input.addon_group_ids.map((group_id, i) => ({ tenant_id: tenant, item_id: itemId!, group_id, sort_order: i + 1 })),
        ),
      );
    }
    return itemId;
  }

  async setAvailable(table: 'menu_items' | 'combos' | 'addons', id: string, is_available: boolean) {
    unwrap(await this.db.client.from(table).update({ is_available }).eq('id', id));
  }

  async deleteItem(id: string) {
    unwrap(await this.db.client.from('menu_items').delete().eq('id', id));
  }

  // ---- Add-on groups ------------------------------------------------------------------------

  async addonGroups(tenant: string): Promise<AddonGroup[]> {
    const rows = unwrap(
      await this.db.client.from('addon_groups').select('*, addons(*)').eq('tenant_id', tenant).order('name'),
    ) as AddonGroup[];
    for (const g of rows) g.addons.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    return rows;
  }

  async saveAddonGroup(
    tenant: string,
    id: string | null,
    input: { name: string; min_select: number; max_select: number | null; addons: { id?: string; name: string; price: number; diet: DietType; is_available: boolean }[] },
  ) {
    const c = this.db.client;
    const columns = { name: input.name.trim(), min_select: input.min_select, max_select: input.max_select };
    let groupId = id;
    if (groupId) unwrap(await c.from('addon_groups').update(columns).eq('id', groupId));
    else groupId = unwrap(await c.from('addon_groups').insert({ ...columns, tenant_id: tenant }).select('id').single()).id;

    const existing = unwrap(await c.from('addons').select('id').eq('group_id', groupId));
    const keep = new Set(input.addons.filter((a) => a.id).map((a) => a.id));
    const removed = existing.filter((a) => !keep.has(a.id)).map((a) => a.id);
    if (removed.length) unwrap(await c.from('addons').delete().in('id', removed));
    for (const [i, a] of input.addons.entries()) {
      const row = { name: a.name.trim(), price: a.price, diet: a.diet, is_available: a.is_available, sort_order: i + 1 };
      if (a.id) unwrap(await c.from('addons').update(row).eq('id', a.id));
      else unwrap(await c.from('addons').insert({ ...row, group_id: groupId, tenant_id: tenant }));
    }
  }

  async deleteAddonGroup(id: string) {
    unwrap(await this.db.client.from('addon_groups').delete().eq('id', id));
  }

  // ---- Combos -------------------------------------------------------------------------------

  async combos(tenant: string): Promise<Combo[]> {
    return unwrap(
      await this.db.client
        .from('combos')
        .select('*, combo_items(id, item_id, variant_id, quantity)')
        .eq('tenant_id', tenant)
        .order('sort_order')
        .order('name'),
    ) as Combo[];
  }

  async saveCombo(tenant: string, id: string | null, input: ComboInput) {
    const c = this.db.client;
    const columns = {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      tax_rate_id: input.tax_rate_id,
      image_url: input.image_url,
      is_available: input.is_available,
    };
    let comboId = id;
    if (comboId) unwrap(await c.from('combos').update(columns).eq('id', comboId));
    else comboId = unwrap(await c.from('combos').insert({ ...columns, tenant_id: tenant }).select('id').single()).id;

    unwrap(await c.from('combo_items').delete().eq('combo_id', comboId));
    if (input.items.length) {
      unwrap(await c.from('combo_items').insert(input.items.map((i) => ({ ...i, combo_id: comboId!, tenant_id: tenant }))));
    }
  }

  async deleteCombo(id: string) {
    unwrap(await this.db.client.from('combos').delete().eq('id', id));
  }

  // ---- GST rates ----------------------------------------------------------------------------

  async taxRates(tenant: string): Promise<TaxRate[]> {
    return unwrap(await this.db.client.from('tax_rates').select('*').eq('tenant_id', tenant).order('rate'));
  }

  async saveTaxRate(tenant: string, id: string | null, input: { name: string; rate: number }) {
    const q = this.db.client.from('tax_rates');
    if (id) unwrap(await q.update(input).eq('id', id));
    else unwrap(await q.insert({ ...input, tenant_id: tenant }));
  }

  /** One default per business (unique index), so clear the old one first. */
  async setDefaultTaxRate(tenant: string, id: string) {
    const q = this.db.client.from('tax_rates');
    unwrap(await q.update({ is_default: false }).eq('tenant_id', tenant).eq('is_default', true));
    unwrap(await q.update({ is_default: true }).eq('id', id));
  }

  async deleteTaxRate(id: string) {
    unwrap(await this.db.client.from('tax_rates').delete().eq('id', id));
  }

  // ---- Photos -------------------------------------------------------------------------------

  /** Uploads to menu-images/<tenant>/<random>.<ext> and returns the public URL. */
  async uploadImage(tenant: string, file: File): Promise<string> {
    if (!IMAGE_TYPES.includes(file.type)) throw new Error('Use a JPG, PNG or WebP photo.');
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Photo is larger than 2 MB. Use a smaller one.');
    const ext = file.type.split('/')[1]!.replace('jpeg', 'jpg');
    const path = `${tenant}/${crypto.randomUUID()}.${ext}`;
    const storage = this.db.client.storage.from('menu-images');
    unwrap(await storage.upload(path, file, { contentType: file.type, cacheControl: '31536000' }));
    return storage.getPublicUrl(path).data.publicUrl;
  }
}
