import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

/**
 * Single Supabase client for the rider app, built from environment.supabase.
 *
 * When url or anonKey is empty (e.g. before `supabase status` has been copied into
 * environment.ts, or before the staging/production projects exist) no client is created and
 * `supabaseConfigError` explains why. Callers must surface that message instead of crashing.
 *
 * SSR: no client is created on the server. Module state there is shared by every request, so a
 * server-side client could leak one rider's session into another request. Auth runs in the
 * browser only; on the server `supabase` is null and AuthService reports "no session".
 */
const { url, anonKey } = environment.supabase;
const isBrowser = typeof window !== 'undefined';

export const supabaseConfigError: string | null =
  !url || !anonKey
    ? `Supabase is not configured for the "${environment.name}" environment. ` +
      'Set supabase.url and supabase.anonKey in src/environments.'
    : null;

export const supabase: SupabaseClient | null =
  supabaseConfigError || !isBrowser
    ? null
    : createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      });

/** Returns the client or throws an Error with a readable message when it is not available. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      supabaseConfigError ??
        (isBrowser ? 'Supabase is not configured.' : 'Supabase is not available during server rendering.'),
    );
  }
  return supabase;
}
