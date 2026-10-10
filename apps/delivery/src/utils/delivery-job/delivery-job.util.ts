import { DeliveryJobItem, DeliveryJobRow, MapPoint, RiderOrder } from '@appTypes/order.types';
import { Json } from '@appTypes/database.types';
import { FINISHED_STATUSES } from '@constants/order.constants';

/** A `my_deliveries()` row as the rider app shows it. */
export function toRiderOrder(row: DeliveryJobRow): RiderOrder {
  return {
    id: row.job_id,
    status: row.status,
    orderId: row.order_id,
    orderNo: row.order_no,
    attemptNo: row.attempt_no,
    offeredAt: row.offered_at,
    acceptedAt: row.accepted_at,
    finishedAt: row.finished_at,
    outletName: row.outlet_name,
    outletAddress: row.outlet_address,
    outletPhone: row.outlet_phone,
    pickup: toPoint(row.outlet_lat, row.outlet_lng),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address ?? '',
    drop: toPoint(row.delivery_lat, row.delivery_lng),
    notes: row.order_notes,
    orderTotal: row.order_total,
    codAmount: row.cod_amount,
    codCollected: row.cod_collected,
    items: toItems(row.items),
  };
}

export function isFinished(order: Pick<RiderOrder, 'status'>): boolean {
  return FINISHED_STATUSES.includes(order.status);
}

function toPoint(lat: number | null, lng: number | null): MapPoint | null {
  return lat === null || lng === null ? null : { lat, lng };
}

/** The `items` JSON column: [{ name, variant, quantity }]; anything else is dropped. */
function toItems(json: Json): DeliveryJobItem[] {
  if (!Array.isArray(json)) {
    return [];
  }
  return json.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return [];
    }
    const { name, variant, quantity } = entry;
    return typeof name === 'string' && typeof quantity === 'number' ? [{ name, variant: typeof variant === 'string' ? variant : null, quantity }] : [];
  });
}
