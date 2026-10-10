/** Supabase auth details the app depends on. */
export const SUPABASE_AUTH = {
  /** user_metadata key that holds the rider's name. */
  DISPLAY_NAME_KEY: 'display_name',
  /** Error codes Supabase returns for an e-mail that already has an account. */
  USER_EXISTS_CODES: ['user_already_exists', 'email_exists'] as readonly string[],
  /** signOut scope that clears only this device's session. */
  LOCAL_SCOPE: 'local',
} as const;

/** Tables the Phase 5 data wiring will use (supabase/migrations, delivery). */
export const SUPABASE_TABLES = {
  RIDERS: 'riders',
  DELIVERY_JOBS: 'delivery_jobs',
  RIDER_LOCATIONS: 'rider_locations',
} as const;
