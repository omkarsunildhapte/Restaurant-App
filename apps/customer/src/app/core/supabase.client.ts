import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

/** Thrown (or returned as an error) when environment.supabase.url / anonKey are empty. */
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      `Supabase is not configured for the "${environment.name}" environment. ` +
        'Set supabase.url and supabase.anonKey in the environment file.'
    );
    this.name = 'SupabaseNotConfiguredError';
  }
}

export const isSupabaseConfigured = !!(environment.supabase.url && environment.supabase.anonKey);

/** True in the browser / Capacitor WebView, false during SSR. */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * The single Supabase client for the app. Created ONLY in the browser: during SSR there is no
 * client at all, so a user's session can never be shared between server requests.
 * Null when the environment has no Supabase config or when running on the server.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured && isBrowser
  ? createClient(environment.supabase.url, environment.supabase.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

/** Returns the client or throws SupabaseNotConfiguredError. */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    if (!isBrowser) throw new Error('Supabase is browser-only and is not available during server rendering.');
    throw new SupabaseNotConfiguredError();
  }
  return supabase;
}

/** DI handle for the client (tests provide a mock; null on the server or when unconfigured). */
export const SUPABASE = new InjectionToken<SupabaseClient | null>('SUPABASE', {
  providedIn: 'root',
  factory: () => supabase,
});
