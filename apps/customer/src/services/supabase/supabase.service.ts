import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { SUPABASE_AUTH_OPTIONS, SUPABASE_ERRORS } from '@constants/supabase.constants';

/** Thrown (or returned as an error) when environment.supabase.url / anonKey are empty. */
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(ERROR_MESSAGES.supabaseNotConfigured(environment.name));
    this.name = SUPABASE_ERRORS.NOT_CONFIGURED_NAME;
  }
}

/** Whether this environment has a Supabase URL and anon key. */
export const isSupabaseConfigured = (): boolean => !!(environment.supabase.url && environment.supabase.anonKey);

/** Resolves the app's single Supabase client, or null (server render / not configured). */
export type SupabaseLoader = () => Promise<SupabaseClient | null>;

/**
 * The single Supabase client (anon key only, Rule 17), loaded on first use with a dynamic import
 * so supabase-js stays out of the initial bundle (P2). Created ONLY in the browser: during SSR
 * there is no client at all, so one request's session can never leak into another. Tests provide
 * a fake loader through this token.
 */
export const SUPABASE = new InjectionToken<SupabaseLoader>('SUPABASE', {
  providedIn: 'root',
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID)) || !isSupabaseConfigured()) return () => Promise.resolve(null);
    let client: Promise<SupabaseClient> | null = null;
    return () =>
      (client ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(environment.supabase.url, environment.supabase.anonKey, { auth: SUPABASE_AUTH_OPTIONS })));
  },
});
