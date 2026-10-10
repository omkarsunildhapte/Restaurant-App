/** Supabase table names the stubs will read once wired (Phase 8). */
export const SUPABASE_TABLES = {
  MENU_ITEMS: 'menu_items',
  DINING_TABLES: 'dining_tables',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PROFILES: 'profiles',
  RIDER_LOCATIONS: 'rider_locations',
} as const;

/** Supabase auth error codes the screens react to. */
export const AUTH_ERROR_CODES = {
  USER_ALREADY_EXISTS: 'user_already_exists',
  EMAIL_EXISTS: 'email_exists',
} as const;

/** verifyOtp types: signed-out phone sign-in vs. adding a phone to the signed-in account. */
export const OTP_TYPES = {
  SMS: 'sms',
  PHONE_CHANGE: 'phone_change',
} as const;

/** user_metadata key holding the customer's display name. */
export const USER_METADATA = {
  DISPLAY_NAME: 'display_name',
} as const;

export const SUPABASE_AUTH_OPTIONS = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
} as const;

export const SUPABASE_ERRORS = {
  NOT_CONFIGURED_NAME: 'SupabaseNotConfiguredError',
} as const;
