/** Going online, sharing position and hearing about new jobs (services/shift). */
export const SHIFT = {
  /** Position report interval while delivering (docs/DELIVERY.md §7). */
  REPORT_EVERY_ON_JOB_MS: 10_000,
  /** Position report interval while online and waiting for a job. */
  REPORT_EVERY_IDLE_MS: 60_000,
  /** Realtime channel name for the rider's own jobs; the rider row id is appended. */
  JOBS_CHANNEL_PREFIX: 'rider-jobs-',
  /** postgres_changes subscription for `delivery_jobs` rows of this rider (RLS applies). */
  REALTIME_EVENT: 'postgres_changes',
  REALTIME_SCHEMA: 'public',
  REALTIME_ALL_EVENTS: '*',
  RIDER_FILTER_COLUMN: 'rider_id',
  ALERT_TITLE: 'Online',
  NOT_VERIFIED: 'You can go online once Thaliyo has checked your documents.',
  REJECTED: 'Your documents were not accepted: ',
  BLOCKED: 'The restaurant has paused your account. Talk to them to start again.',
} as const;
