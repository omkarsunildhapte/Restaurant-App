import { Injectable } from '@angular/core';
import { DiningTable, TableBooking } from '@appTypes/table.types';
import { STUB_OPERATIONS } from '@constants/messages.constants';
import { notImplemented } from '@utils/not-implemented/not-implemented.util';

/** Table booking data. Stubs until the customer side is wired to Supabase (Phase 8). */
@Injectable({ providedIn: 'root' })
export class TableService {
  // TODO(Phase 8): Supabase table dining_tables
  listTables(): Promise<DiningTable[]> {
    return Promise.resolve([]);
  }

  // TODO(Phase 8): Supabase table dining_tables
  getTable(_id: string): Promise<DiningTable | null> {
    return Promise.resolve(null);
  }

  // TODO(Phase 8): Supabase table <table_bookings> (no bookings table exists yet)
  listBookings(_userId: string): Promise<TableBooking[]> {
    return Promise.resolve([]);
  }

  // TODO(Phase 8): Supabase table <table_bookings> (no bookings table exists yet)
  bookTable(_booking: TableBooking): Promise<void> {
    return notImplemented(STUB_OPERATIONS.BOOK_TABLE);
  }
}
