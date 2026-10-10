/**
 * Row shapes of the Supabase tables this panel will use (see supabase/migrations).
 * Only the columns the panel needs are listed; every tenant-scoped row carries tenant_id.
 */

export type DietType = 'veg' | 'non_veg' | 'egg';
export type ItemKind = 'food' | 'beverage';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'delivered' | 'cancelled';

export interface TenantRow {
  id: string;
  tenant_id: string;
}

export interface MenuCategoryRow extends TenantRow {
  name: string;
  kind: ItemKind;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItemRow extends TenantRow {
  category_id: string;
  name: string;
  description: string | null;
  diet: DietType;
  price: number;
  tax_rate_id: string | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
}

export interface ComboRow extends TenantRow {
  name: string;
  description: string | null;
  price: number;
  tax_rate_id: string | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
}

export interface ComboItemRow extends TenantRow {
  combo_id: string;
  item_id: string;
  variant_id: string | null;
  quantity: number;
}

export interface DiningTableRow extends TenantRow {
  outlet_id: string;
  name: string;
  seats: number;
  area: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface OrderRow extends TenantRow {
  outlet_id: string;
  order_no: number;
  type: OrderType;
  status: OrderStatus;
  table_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  created_by: string | null;
  created_at: string;
}

export interface OrderItemRow extends TenantRow {
  order_id: string;
  item_id: string | null;
  combo_id: string | null;
  name: string;
  variant_name: string | null;
  addons: { name: string; price: number }[];
  quantity: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
}

/** Fields the client may change on an order; everything else is server-maintained. */
export type OrderUpdate = Partial<Pick<OrderRow, 'status' | 'notes' | 'table_id'>>;

/** public.profiles (one per auth user, no tenant_id). */
export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
}
