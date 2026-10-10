import { Entity } from '@appTypes/common.types';

/** Mirrors the `delivery_status` enum in supabase/migrations (delivery). */
export type DeliveryStatus = 'offered' | 'assigned' | 'at_pickup' | 'picked_up' | 'at_drop' | 'delivered' | 'failed' | 'cancelled';

/** A delivery job assigned to the rider (TODO(Phase 5): delivery_jobs joined to orders). */
export interface RiderOrder extends Entity {
  status: DeliveryStatus;
  deliveryAddress: string;
  codAmount: number;
}

/** Order page tabs. */
export type OrderSegment = 'active' | 'history';

/** One tab of the order page segment. */
export interface OrderSegmentTab {
  value: OrderSegment;
  label: string;
  emptyText: string;
}
