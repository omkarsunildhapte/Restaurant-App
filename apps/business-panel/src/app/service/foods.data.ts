import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ItemKind, MenuItemRow } from './db.types';
import { notConnected } from './not-connected';

/** View model used by the Foods / Beverage screens and their dialogs. */
export interface MenuItemView {
  id: string;
  itemName: string;
  description: string;
  price: number | null;
  discount: number | null;
  logoUrl: string | null;
  bannerImage: string | null;
  type: 'single' | 'beverage';
}

export type MenuItemInput = Omit<MenuItemView, 'id'>;

export const kindOf = (type: MenuItemView['type']): ItemKind => (type === 'beverage' ? 'beverage' : 'food');

/** menu_items row to view. `discount` and `logoUrl` have no column yet. */
export function toMenuItemView(row: MenuItemRow, kind: ItemKind): MenuItemView {
  return {
    id: row.id,
    itemName: row.name,
    description: row.description ?? '',
    price: row.price,
    discount: null,
    logoUrl: null,
    bannerImage: row.image_url,
    type: kind === 'beverage' ? 'beverage' : 'single',
  };
}

/** View to menu_items columns (tenant_id / category_id get added by the Phase 1 implementation). */
export function toMenuItemColumns(input: MenuItemInput): Partial<MenuItemRow> {
  return {
    name: input.itemName,
    description: input.description || null,
    price: input.price ?? 0,
    image_url: input.bannerImage,
  };
}

/** Foods and beverages (one table, split by menu_categories.kind). */
@Injectable({ providedIn: 'root' })
export class FoodsDataService {
  // TODO(Phase 1): Supabase menu_items + menu_categories (kind 'food'|'beverage'); variants item_variants; add-ons addon_groups/addons/item_addon_groups
  list(kind: ItemKind): Observable<MenuItemView[]> {
    return of([]);
  }

  // TODO(Phase 1): Supabase menu_items insert; photos to storage bucket 'menu-images' at '<tenant_id>/<file>'
  create(input: MenuItemInput): Observable<MenuItemView> {
    return notConnected(`create ${kindOf(input.type)} "${toMenuItemColumns(input).name}"`);
  }

  // TODO(Phase 1): Supabase menu_items update; photos to storage bucket 'menu-images' at '<tenant_id>/<file>'
  update(id: string, input: MenuItemInput): Observable<void> {
    return notConnected(`update ${kindOf(input.type)} ${id}`);
  }

  // TODO(Phase 1): Supabase menu_items delete
  remove(id: string): Observable<void> {
    return notConnected(`delete menu item ${id}`);
  }
}
