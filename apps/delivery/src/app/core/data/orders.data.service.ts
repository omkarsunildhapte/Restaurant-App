import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/** A delivery order as the order page lists it (was Firestore `orders`). */
export interface RiderOrder {
  id: string;
  [field: string]: unknown;
}

/** Orders assigned to the rider. Firestore was removed; stub until Phase 5. */
@Injectable({ providedIn: 'root' })
export class OrdersDataService {
  // TODO(Phase 5): Supabase table delivery_jobs (joined to orders)
  getOrders(): Observable<RiderOrder[]> {
    return of([]);
  }
}
