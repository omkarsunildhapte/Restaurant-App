import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Owns the single Supabase client for the app, created from `environment.supabase`.
 *
 * - `client` is null when the config is missing (see `configError`) and during
 *   server-side rendering (sessions live in the browser's localStorage).
 * - Callers should use `requireClient()` when they need it, which throws a clear error.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  readonly configError: string | null;
  readonly client: SupabaseClient | null;

  constructor() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    const { url, anonKey } = environment.supabase;

    if (!url || !anonKey) {
      this.configError =
        `Supabase is not configured for the "${environment.name}" environment: ` +
        `set supabase.url and supabase.anonKey in src/environments.`;
      this.client = null;
      if (isBrowser) console.error(`[supabase] ${this.configError}`);
      return;
    }

    this.configError = null;
    this.client = isBrowser ? createClient(url, anonKey) : null;
  }

  requireClient(): SupabaseClient {
    if (this.client) return this.client;
    throw new Error(this.configError ?? 'Supabase is only available in the browser.');
  }
}
