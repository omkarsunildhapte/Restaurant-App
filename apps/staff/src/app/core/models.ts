/** Row shapes from Supabase (supabase/migrations 0001–0003, 0006, 0009). Numbers arrive as numbers. */

export type Role = 'admin' | 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'delivery';
export type Diet = 'veg' | 'non_veg' | 'egg';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'delivered' | 'cancelled';
export type KotStatus = 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'other';

export interface Workspace {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role: Role;
  /** null = the person works at every outlet of the business (owner, admin). */
  outlet_id: string | null;
  status: string;
  writable: boolean;
}

export interface Outlet {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  gstin: string | null;
}

export interface Category {
  id: string;
  name: string;
  kind: 'food' | 'beverage';
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  tax_rate_id: string | null;
  name: string;
  description: string | null;
  diet: Diet;
  price: number;
  is_available: boolean;
  sort_order: number;
}

export interface Variant {
  id: string;
  item_id: string;
  name: string;
  price: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  min_select: number;
  max_select: number | null;
}

export interface Addon {
  id: string;
  group_id: string;
  name: string;
  price: number;
  diet: Diet;
  is_available: boolean;
}

export interface Menu {
  categories: Category[];
  items: MenuItem[];
  variants: Variant[];
  groups: AddonGroup[];
  addons: Addon[];
  /** item id → addon group ids, in order */
  itemGroups: Record<string, string[]>;
  /** GST rates by id, plus the business's default rate and whether menu prices include GST. */
  taxRates: Record<string, number>;
  defaultTaxRate: number;
  pricesIncludeTax: boolean;
  /** Business settings used at the counter (supabase 0011). */
  roundOff: boolean;
  packagingCharge: number;
  /** The business's phone, where the day-end summary is sent on WhatsApp. */
  ownerPhone: string | null;
}

export interface TableStatus {
  table_id: string;
  name: string;
  seats: number;
  area: string | null;
  sort_order: number;
  order_id: string | null;
  order_no: number | null;
  total: number | null;
  opened_at: string | null;
  bill_requested_at: string | null;
  status: 'free' | 'occupied' | 'bill_requested';
}

export interface Order {
  id: string;
  tenant_id: string;
  outlet_id: string;
  order_no: number | null;
  type: OrderType;
  status: OrderStatus;
  table_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  bill_requested_at: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string | null;
  name: string;
  variant_name: string | null;
  addons: { name: string; price: number }[];
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  notes: string | null;
  kot_id: string | null;
  /** The bill this item was paid on (item-wise split bills); null until billed. */
  bill_id: string | null;
  created_at: string;
}

export interface Kot {
  id: string;
  order_id: string;
  outlet_id: string;
  round_no: number;
  status: KotStatus;
  created_at: string;
  status_changed_at: string;
}

export interface Bill {
  id: string;
  order_id: string;
  bill_no: number;
  invoice_no: string;
  subtotal: number;
  discount: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  round_off?: number;
  total: number;
  payment_mode: PaymentMode;
  paid_at: string;
  is_void: boolean;
  void_reason?: string | null;
}

export interface Payment {
  method: PaymentMode;
  amount: number;
  reference?: string;
}

export interface DaySession {
  id: string;
  outlet_id: string;
  business_date: string;
  opened_at: string;
  opening_cash: number;
  closed_at: string | null;
  counted_cash: number | null;
  expected_cash: number | null;
  cash_difference: number | null;
  summary: DaySummary | null;
}

/** One cash pay-out during the day (public.cash_out_for_day). Staff rows carry no name. */
export interface CashOut {
  kind: 'purchase' | 'staff' | 'other';
  label: string;
  amount: number;
  paid_at: string;
  recorded_by_name: string | null;
}

export interface DaySummary {
  bills: number;
  voidBills: number;
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  total: number;
  byMethod: Partial<Record<PaymentMode, number>>;
  openOrders?: number;
  /** Cash that left the drawer: purchases, staff payments, other (supabase 0010). */
  cashOut?: number;
  cashOutByKind?: Partial<Record<'purchase' | 'staff' | 'other', number>>;
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const money = (n: number | null | undefined): string => inr.format(Number(n ?? 0));

/**
 * Two decimals, the way Postgres rounds numeric money (half away from zero). Plain
 * Math.round(n * 100) gets 5.005 wrong (5.005 * 100 = 500.4999…), which would make a bill made
 * on the device differ from the server's by a paisa; toPrecision(15) removes that float noise.
 */
export const round2 = (n: number): number => {
  const cents = Number((Math.abs(n) * 100).toPrecision(15));
  return (Math.sign(n) * Math.round(cents)) / 100;
};

export function minutesSince(iso: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
}
