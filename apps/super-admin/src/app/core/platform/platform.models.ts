/** Shapes returned by the Node platform API (backend/src/platform, /platform/v1). */

export type TenantStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
export type TenantRole = 'admin' | 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'delivery';
export type Features = Record<string, boolean>;

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  max_outlets: number | null;
  features: Features;
  sort_order: number;
  is_active: boolean;
}

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan_id: string;
  trial_ends_at: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  outlet_count: number;
  staff_count: number;
}

export interface Tenant extends Omit<TenantRow, 'outlet_count' | 'staff_count'> {
  legal_name: string | null;
  gstin: string | null;
  fssai_number: string | null;
  address: string | null;
  feature_overrides: Features;
}

export interface TenantDetail {
  tenant: Tenant;
  features: Features;
  outlets: { id: string; name: string; city: string | null; phone: string | null; is_active: boolean }[];
  members: {
    id: string;
    role: TenantRole;
    outlet_id: string | null;
    is_active: boolean;
    profiles: { email: string | null; full_name: string | null } | null;
  }[];
  invitations: { id: string; email: string; role: TenantRole; outlet_id: string | null; expires_at: string }[];
  notes: string;
}

export interface PlatformStats {
  tenants_total: number;
  by_status: Partial<Record<TenantStatus, number>>;
  by_plan: Record<string, number>;
  mrr: number;
  new_last_30_days: number;
  outlets_total: number;
  staff_total: number;
  orders_last_30_days: number;
  trials_ending: { id: string; name: string; trial_ends_at: string }[];
  recent_tenants: { id: string; name: string; slug: string; status: TenantStatus; plan_id: string; created_at: string }[];
}

export interface NewTenant {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName?: string;
  planId: string;
  outletName?: string;
  city?: string;
  phone?: string;
  trialDays: number;
}

export const STATUSES: readonly TenantStatus[] = ['trial', 'active', 'past_due', 'suspended', 'cancelled'];

export const STATUS_LABEL: Record<TenantStatus, string> = {
  trial: 'Trial',
  active: 'Active',
  past_due: 'Payment due',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
};

export function statusClass(status: TenantStatus): string {
  const base = 'rounded-full px-2 py-0.5 text-[11px] font-semibold ';
  switch (status) {
    case 'active':
      return base + 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300';
    case 'trial':
      return base + 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300';
    case 'past_due':
      return base + 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300';
    default:
      return base + 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300';
  }
}

export const ROLE_LABEL: Record<TenantRole, string> = {
  admin: 'Admin',
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
  waiter: 'Waiter',
  kitchen: 'Kitchen',
  delivery: 'Delivery',
};

/** Feature switches in display order, with what each one turns on. */
export const FEATURES: readonly { key: string; label: string }[] = [
  { key: 'pos', label: 'POS billing' },
  { key: 'kds', label: 'Kitchen display' },
  { key: 'waiter_app', label: 'Waiter app' },
  { key: 'delivery', label: 'Own delivery' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'multi_outlet', label: 'Multiple outlets' },
];

export function rupees(value: number): string {
  return '₹' + Math.round(value).toLocaleString('en-IN');
}

export function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function shortDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
