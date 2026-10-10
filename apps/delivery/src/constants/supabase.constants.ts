/** Supabase auth details the app depends on. */
export const SUPABASE_AUTH = {
  /** user_metadata key that holds the rider's name. */
  DISPLAY_NAME_KEY: 'display_name',
  /** Error codes Supabase returns for an e-mail that already has an account. */
  USER_EXISTS_CODES: ['user_already_exists', 'email_exists'] as readonly string[],
  /** signOut scope that clears only this device's session. */
  LOCAL_SCOPE: 'local',
} as const;

/** Tables the rider app reads or writes (supabase/migrations, delivery). */
export const SUPABASE_TABLES = {
  RIDERS: 'riders',
  DELIVERY_JOBS: 'delivery_jobs',
  RIDER_LOCATIONS: 'rider_locations',
} as const;

/** Database functions the rider app calls (supabase/migrations 0001, 0005, 0013). */
export const SUPABASE_RPC = {
  MY_WORKSPACES: 'my_workspaces',
  MY_DELIVERIES: 'my_deliveries',
  RESPOND_TO_DELIVERY: 'respond_to_delivery',
  ADVANCE_DELIVERY: 'advance_delivery',
  COMPLETE_DELIVERY: 'complete_delivery',
  FAIL_DELIVERY: 'fail_delivery',
  SET_RIDER_ONLINE: 'set_rider_online',
  REPORT_RIDER_LOCATION: 'report_rider_location',
} as const;

/** The membership role that makes a person a rider of a business (tenant_role enum). */
export const RIDER_ROLE = 'delivery';

/** Columns of `riders` the app reads (no verification internals beyond the status). */
export const RIDER_COLUMNS = 'id, tenant_id, user_id, full_name, phone, vehicle_type, vehicle_number, licence_number, upi_id, verification, rejection_reason, is_active, is_online';

/** How many past jobs the History tab shows (my_deliveries returns at most 200). */
export const HISTORY_LIMIT = 50;
