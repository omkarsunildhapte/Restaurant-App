import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * The one Supabase client for the staff app (same pattern as apps/delivery).
 *
 * SSR: no client exists on the server. Module state there is shared by every request, so a
 * server-side client could leak one person's session into another request. Sign-in and all
 * data work run in the browser; on the server `supabase` is null.
 */
const { url, anonKey } = environment.supabase;
const isBrowser = typeof window !== 'undefined';

export const supabaseConfigError: string | null =
  !url || !anonKey
    ? `Supabase is not configured for the "${environment.name}" environment. Set supabase.url and supabase.anonKey in src/environments.`
    : null;

export const supabase: SupabaseClient | null =
  supabaseConfigError || !isBrowser
    ? null
    : createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'rp-staff.auth' } });

/** The client, or a readable error when it is not available. */
export function db(): SupabaseClient {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? 'Supabase is not available during server rendering.');
  }
  return supabase;
}

/** Turns a Supabase/PostgREST error into the message the database raised (they are written for people). */
export function dbError(error: { message?: string; code?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}
