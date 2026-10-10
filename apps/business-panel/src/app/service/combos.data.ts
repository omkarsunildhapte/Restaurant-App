import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ComboRow } from './db.types';
import { notConnected } from './not-connected';

/** Item reference shown/selected in the combo dialog (maps to combo_items.item_id). */
export interface ComboItemRef {
  id: string;
  itemName: string;
}

export interface ComboView {
  id: string;
  itemName: string;
  itemList: ComboItemRef[];
  description: string;
  price: number | null;
  discount: number | null;
  logoUrl: string | null;
  bannerImage: string | null;
  type: 'combo';
}

export type ComboInput = Omit<ComboView, 'id'>;

/** View to combos columns; itemList becomes combo_items rows (quantity 1). */
export function toComboColumns(input: ComboInput): Partial<ComboRow> {
  return {
    name: input.itemName,
    description: input.description || null,
    price: input.price ?? 0,
    image_url: input.bannerImage,
  };
}

@Injectable({ providedIn: 'root' })
export class CombosDataService {
  // TODO(Phase 1): Supabase combos + combo_items
  list(): Observable<ComboView[]> {
    return of([]);
  }

  // TODO(Phase 1): Supabase combos insert + combo_items insert
  create(input: ComboInput): Observable<ComboView> {
    return notConnected(`create combo "${toComboColumns(input).name}"`);
  }

  // TODO(Phase 1): Supabase combos update + replace combo_items
  update(id: string, input: ComboInput): Observable<void> {
    return notConnected(`update combo ${id}`);
  }

  // TODO(Phase 1): Supabase combos delete (combo_items cascade)
  remove(id: string): Observable<void> {
    return notConnected(`delete combo ${id}`);
  }
}
