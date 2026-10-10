import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DiningTableRow } from './db.types';
import { notConnected } from './not-connected';

export interface DiningTableView {
  id: string;
  itemName: string;
  description: string;
  price: number | null;
  discount: number | null;
  bannerImages: { url: string }[];
}

export type DiningTableInput = Omit<DiningTableView, 'id'>;

/** dining_tables row to view. The old price/discount/images have no columns. */
export function toDiningTableView(row: DiningTableRow): DiningTableView {
  return { id: row.id, itemName: row.name, description: row.area ?? '', price: null, discount: null, bannerImages: [] };
}

/** View to dining_tables columns (outlet_id / tenant_id get added by the Phase 1 implementation). */
export function toDiningTableColumns(input: DiningTableInput): Partial<DiningTableRow> {
  return { name: input.itemName, area: input.description || null };
}

/** Old "tableBook" documents. No matching table exists in the migrations. */
export interface TableBookingView {
  id: string;
  userId: string;
  tableid: string;
  guests: number;
  time: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class TablesDataService {
  // TODO(Phase 1): Supabase dining_tables (needs outlet_id)
  list(): Observable<DiningTableView[]> {
    return of([]);
  }

  // TODO(Phase 1): Supabase dining_tables insert (needs outlet_id)
  create(input: DiningTableInput): Observable<DiningTableView> {
    return notConnected(`create table "${toDiningTableColumns(input).name}"`);
  }

  // TODO(Phase 1): Supabase dining_tables delete
  remove(id: string): Observable<void> {
    return notConnected(`delete table ${id}`);
  }

  // TODO(Phase 1): Supabase (no table-booking table in the migrations yet)
  listBookings(): Observable<TableBookingView[]> {
    return of([]);
  }

  // TODO(Phase 1): Supabase (no table-booking table in the migrations yet)
  removeBooking(id: string): Observable<void> {
    return notConnected(`delete booking ${id}`);
  }
}
