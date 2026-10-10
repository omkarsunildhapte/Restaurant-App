import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { notImplemented } from '../core/data/not-implemented';

export interface DiningTable {
  id: string;
  itemName?: string;
  description?: string;
  price?: number;
  bannerImages?: string[];
  [key: string]: unknown;
}

export interface TableBooking {
  id?: string;
  guests: number;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  notes?: string;
  tableId?: string;
  userId?: string;
}

/**
 * Table booking data. Firestore was removed; every method is a stub until the
 * customer side is wired to Supabase (Phase 8).
 */
@Injectable({
  providedIn: 'root'
})
export class TableService {

  // TODO(Phase 8): Supabase table dining_tables
  getTable(): Observable<DiningTable[]> {
    return of([]);
  }

  // TODO(Phase 8): Supabase table dining_tables
  getTableById(_id: string): Observable<DiningTable | null> {
    return of(null);
  }

  // TODO(Phase 8): Supabase table <table_bookings> (no bookings table exists yet)
  addToUserTable(_userId: string, _itemData: TableBooking): Observable<void> {
    return notImplemented('save booking to user history');
  }

  // TODO(Phase 8): Supabase table <table_bookings> (no bookings table exists yet)
  getTableBook(_userId: string): Observable<TableBooking[]> {
    return of([]);
  }

  // TODO(Phase 8): Supabase table <table_bookings> (no bookings table exists yet)
  addTable(_tableData: TableBooking, _userId: string): Observable<void> {
    return notImplemented('book table');
  }
}
