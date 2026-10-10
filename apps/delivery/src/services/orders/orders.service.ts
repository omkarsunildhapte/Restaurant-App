import { Injectable } from '@angular/core';
import { OrderSegment, RiderOrder } from '@appTypes/order.types';

/** Delivery jobs assigned to the rider. Stub until Phase 5: resolves an empty list. */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  // TODO(Phase 5): Supabase table delivery_jobs (joined to orders), filtered by segment
  async listOrders(_segment: OrderSegment): Promise<RiderOrder[]> {
    return [];
  }
}
