import { DeliveryStatus, OrderSegment, OrderSegmentTab } from '@appTypes/order.types';

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
