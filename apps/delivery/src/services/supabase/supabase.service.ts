import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { ERROR_MESSAGES, supabaseConfigMessage } from '@constants/messages.constants';

/**
 * The app's single Supabase client, built from environment.supabase.
 *
 * - No client when url/anonKey are empty (staging/production until those projects exist):
 *   `configError` says why, and callers show that message instead of crashing.
 * - No client during SSR: module and service state on the server is shared by every request, so a
 *   server-side client could leak one rider's session into another request. Auth is browser-only.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly configError: string | null = environment.supabase.url && environment.supabase.anonKey ? null : supabaseConfigMessage(environment.name);

  readonly client: SupabaseClient | null = this.isBrowser && !this.configError ? createClient(environment.supabase.url, environment.supabase.anonKey) : null;

  /** The client, or an Error with a readable message when it is not available. */
  require(): SupabaseClient {
    if (!this.client) {
      throw new Error(this.configError ?? (this.isBrowser ? ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED : ERROR_MESSAGES.SUPABASE_SERVER));
    }
    return this.client;
  }
}
