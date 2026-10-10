import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OrderStatus, OrderUpdate } from './db.types';
import { notConnected } from './not-connected';

/** View model used by the Orders screen. */
export interface OrderView {
  id: string;
  userId: string | null;
  items: { name: string; image?: string }[];
  paymentType: string;
  totalValue: number;
  status: OrderStatus;
}

/** Status flow: new, preparing, ready, then served | delivered | cancelled. */
export const ORDER_STATUSES: readonly OrderStatus[] = ['new', 'preparing', 'ready', 'served', 'delivered', 'cancelled'];

@Injectable({ providedIn: 'root' })
export class OrdersDataService {
  // TODO(Phase 1): Supabase orders + order_items (payment type from bills)
  list(): Observable<OrderView[]> {
    return of([]);
  }

  // TODO(Phase 1): Supabase orders update (client may only change status / notes / table_id)
  update(id: string, changes: OrderUpdate): Observable<void> {
    return notConnected(`update order ${id} (${Object.keys(changes).join(', ')})`);
  }
}
