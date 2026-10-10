import type { SupabaseClient } from '@supabase/supabase-js';

/** Who is calling, set by `requireUser`. */
export interface Caller {
  userId: string;
  email: string | undefined;
  /** Acts as the caller, so database RLS decides what they may do. */
  db: SupabaseClient;
}

declare module 'express-serve-static-core' {
  interface Request {
    caller?: Caller;
  }
}
