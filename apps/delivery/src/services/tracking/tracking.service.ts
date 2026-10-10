import { Injectable, inject } from '@angular/core';
import { OrdersService } from '@services/orders/orders.service';
import { ActiveDelivery } from '@appTypes/tracking.types';
import { IN_PROGRESS_STATUSES } from '@constants/order.constants';

/**
 * The delivery the track-map page follows: the rider's newest accepted, unfinished job (an offer
 * not yet accepted is not "on the way"). Positions come with it: the restaurant (pickup) and
 * the customer (drop), both null when not geocoded yet.
 */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly orders = inject(OrdersService);

  async getActiveDelivery(): Promise<ActiveDelivery | null> {
    const open = await this.orders.listOrders('active');
    return open.find((order) => IN_PROGRESS_STATUSES.includes(order.status)) ?? null;
  }
}
