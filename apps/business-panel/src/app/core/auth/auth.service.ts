import { Injectable, computed, inject, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseClientService } from '../supabase.client';

/**
 * Minimal Supabase auth wrapper: sign in / sign up / sign out plus the current
 * session as a signal (kept in sync via onAuthStateChange).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseClientService);

  private readonly _session = signal<Session | null>(null);
  /** Current session (null when signed out, before restore, or on the server). */
  readonly session = this._session.asReadonly();
  readonly user = computed<User | null>(() => this._session()?.user ?? null);
  readonly isSignedIn = computed(() => this._session() !== null);
  /** Resolves once the persisted session (if any) has been restored. */
  readonly ready: Promise<void>;
  /** Non-null when Supabase is not configured; shown on the login page. */
  readonly configError = this.supabase.configError;

  constructor() {
    const client = this.supabase.client;
    if (!client) {
      this.ready = Promise.resolve();
      return;
    }
    client.auth.onAuthStateChange((_event, session) => this._session.set(session));
    this.ready = client.auth
      .getSession()
      .then(({ data }) => this._session.set(data.session))
      .catch((error) => console.error('[auth] Could not restore session', error));
  }

  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await this.supabase
      .requireClient()
      .auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  }

  /** `metadata` is stored as the user's metadata (e.g. { full_name }). */
  async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<void> {
    const { error } = await this.supabase
      .requireClient()
      .auth.signUp({ email, password, options: metadata ? { data: metadata } : undefined });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const client = this.supabase.client;
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }
}
