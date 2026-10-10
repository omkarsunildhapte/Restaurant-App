import { Entity } from '@appTypes/common.types';
import { Database } from '@appTypes/database.types';

/** Mirrors the `delivery_status` enum in supabase/migrations (delivery). */
export type DeliveryStatus = Database['public']['Enums']['delivery_status'];

/**
 * One row of `my_deliveries()` (migrations 0005, 0013). The generator marks every column of a
 * table function as non-null; customer details and drop position are null once a job is
 * finished, and times/positions may be null, so those columns are widened here.
 */
type DeliveryJobRowGenerated = Database['public']['Functions']['my_deliveries']['Returns'][number];
type NullableColumns = 'accepted_at' | 'finished_at' | 'cod_collected' | 'customer_name' | 'customer_phone' | 'delivery_address' | 'delivery_lat' | 'delivery_lng' | 'order_notes' | 'outlet_address' | 'outlet_phone' | 'outlet_lat' | 'outlet_lng';
export type DeliveryJobRow = Omit<DeliveryJobRowGenerated, NullableColumns> & { [K in NullableColumns]: DeliveryJobRowGenerated[K] | null };

/** A line of the order on a job (name, size, quantity; prices stay with the restaurant). */
export interface DeliveryJobItem {
  name: string;
  variant: string | null;
  quantity: number;
}

/** A point on the map; null when the restaurant or the address has no position yet. */
export interface MapPoint {
  lat: number;
  lng: number;
}

/** A delivery job assigned to the rider (delivery_jobs joined to orders and outlets). `id` is the job id. */
export interface RiderOrder extends Entity {
  status: DeliveryStatus;
  orderId: string;
  orderNo: number;
  attemptNo: number;
  offeredAt: string;
  acceptedAt: string | null;
  finishedAt: string | null;
  outletName: string;
  outletAddress: string | null;
  outletPhone: string | null;
  pickup: MapPoint | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string;
  drop: MapPoint | null;
  notes: string | null;
  orderTotal: number;
  /** Cash to collect at the door (0 when prepaid). */
  codAmount: number;
  codCollected: number | null;
  items: DeliveryJobItem[];
}

/** Order page tabs. */
export type OrderSegment = 'active' | 'history';

/** One tab of the order page segment. */
export interface OrderSegmentTab {
  value: OrderSegment;
  label: string;
  emptyText: string;
}

/** The steps a rider moves a job through before finishing it (advance_delivery). */
export type DeliveryStep = Extract<DeliveryStatus, 'at_pickup' | 'picked_up' | 'at_drop'>;

/** Finishing a job (complete_delivery): the customer's OTP, or a proof photo URL, and cash collected. */
export interface CompleteDeliveryInput {
  otp: string | null;
  photoUrl: string | null;
  codCollected: number | null;
  position: MapPoint | null;
}

/** Could not deliver (fail_delivery). */
export interface FailDeliveryInput {
  reason: string;
  photoUrl: string | null;
  position: MapPoint | null;
}
