import { DeliveryJobRow } from '@appTypes/order.types';
import { RiderRow } from '@appTypes/rider.types';

/** A `my_deliveries()` row: an assigned cash-on-delivery job at Brew & Leaf Baner. */
export function deliveryJobRow(overrides: Partial<Record<keyof DeliveryJobRow, unknown>> = {}): DeliveryJobRow {
  return {
    job_id: 'job-1',
    status: 'assigned',
    attempt_no: 1,
    offered_at: '2026-10-10T07:30:00Z',
    accepted_at: '2026-10-10T07:31:00Z',
    finished_at: null,
    cod_amount: 230,
    cod_collected: null,
    outlet_id: 'outlet-1',
    outlet_name: 'Brew & Leaf Baner',
    outlet_address: 'Baner Road, Pune',
    outlet_phone: '+91 98220 11111',
    outlet_lat: 18.559,
    outlet_lng: 73.7867,
    order_id: 'order-1',
    order_no: 17,
    customer_name: 'Meera',
    customer_phone: '+91 90000 00001',
    delivery_address: 'Flat 4, Balewadi High Street',
    delivery_lat: 18.57,
    delivery_lng: 73.77,
    order_notes: null,
    order_total: 230,
    items: [{ name: 'Cold coffee', variant: null, quantity: 2 }],
    ...overrides,
  } as DeliveryJobRow;
}

/** A verified, active `riders` row for rider-1 at tenant-1. */
export function riderRow(overrides: Partial<RiderRow> = {}): RiderRow {
  return {
    id: 'rider-row-1',
    tenant_id: 'tenant-1',
    user_id: 'rider-1',
    full_name: 'Sagar Pawar',
    phone: '+91 98220 33333',
    vehicle_type: 'scooter',
    vehicle_number: 'MH12AB1234',
    licence_number: 'MH1220200012345',
    photo_url: null,
    licence_url: null,
    id_proof_url: null,
    upi_id: 'sagar@upi',
    verification: 'verified',
    rejection_reason: null,
    verified_at: '2026-10-10T07:00:00Z',
    is_active: true,
    is_online: false,
    last_lat: null,
    last_lng: null,
    last_seen_at: null,
    created_at: '2026-10-10T06:00:00Z',
    updated_at: '2026-10-10T07:00:00Z',
    ...overrides,
  };
}

/** One recorded supabase-js call. */
export interface RecordedCall {
  kind: 'rpc' | 'select' | 'insert' | 'update';
  name: string;
  args?: unknown;
  filters: [string, unknown][];
}

/**
 * A supabase-js client stand-in for data services: `.rpc()` and the `.from()` chains the app
 * uses, answering from `answers` (keyed by RPC or table name) and recording every call.
 */
export function fakeDataClient(answers: Record<string, { data: unknown; error: { message: string } | null }>) {
  const calls: RecordedCall[] = [];
  const answer = (name: string) => answers[name] ?? { data: null, error: null };
  const chain = (call: RecordedCall) => {
    const builder = {
      select: () => builder,
      eq: (column: string, value: unknown) => {
        call.filters.push([column, value]);
        return builder;
      },
      maybeSingle: async () => answer(call.name),
      single: async () => answer(call.name),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(answer(call.name)).then(resolve),
    };
    return builder;
  };
  const client = {
    rpc: vi.fn(async (name: string, args?: unknown) => {
      calls.push({ kind: 'rpc', name, args, filters: [] });
      return answer(name);
    }),
    from: vi.fn((table: string) => ({
      select: () => {
        const call: RecordedCall = { kind: 'select', name: table, filters: [] };
        calls.push(call);
        return chain(call);
      },
      insert: (row: unknown) => {
        const call: RecordedCall = { kind: 'insert', name: table, args: row, filters: [] };
        calls.push(call);
        return chain(call);
      },
      update: (patch: unknown) => {
        const call: RecordedCall = { kind: 'update', name: table, args: patch, filters: [] };
        calls.push(call);
        return chain(call);
      },
    })),
  };
  return { client, calls, supabase: { client, configError: null, require: () => client } };
}
