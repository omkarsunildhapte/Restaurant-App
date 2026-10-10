import { DeliveryStatus, OrderSegment, OrderSegmentTab } from '@appTypes/order.types';

/** Statuses after which a job is over (it moves to History). */
export const FINISHED_STATUSES: readonly DeliveryStatus[] = ['delivered', 'failed', 'cancelled'];

/** Accepted and on the way: what the track-map page follows. */
export const IN_PROGRESS_STATUSES: readonly DeliveryStatus[] = ['assigned', 'at_pickup', 'picked_up', 'at_drop'];

/** Status an offer ends in when accepted or rejected (respond_to_delivery). */
export const RESPONSE_STATUS = { ACCEPTED: 'assigned', REJECTED: 'cancelled' } as const satisfies Record<string, DeliveryStatus>;

/** Order screen. */
export const ORDER_PAGE = {
  DEFAULT_SEGMENT: 'active' satisfies OrderSegment,
  SEGMENTS: [
    { value: 'active', label: 'Active', emptyText: 'No active orders right now.' },
    { value: 'history', label: 'History', emptyText: 'No past orders yet.' },
  ] as readonly OrderSegmentTab[],
  STATUS_LABELS: {
    offered: 'Offered',
    assigned: 'Pickup Pending',
    at_pickup: 'At Pickup',
    picked_up: 'Picked Up',
    at_drop: 'At Drop',
    delivered: 'Delivered',
    failed: 'Failed',
    cancelled: 'Cancelled',
  } satisfies Record<DeliveryStatus, string>,
} as const;
