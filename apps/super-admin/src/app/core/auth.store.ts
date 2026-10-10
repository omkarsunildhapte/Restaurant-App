import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Session } from '@supabase/supabase-js';
import { ApiClient, ApiError } from '@app/core/api.client';
import { supabase } from '@app/core/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** Sales CRM role. A platform Super Admin is always 'admin'. */
  role: 'admin' | 'sales';
  isSuperAdmin: boolean;
}

/**
 * Session state, from Supabase Auth.
 *
 * Supabase owns the session (localStorage, token refresh); this store mirrors it into
 * signals. `user` comes from the marketing API's /auth/me, which is also the check that the
 * account is allowed into the console at all: a Supabase account without a CRM role (a
 * restaurant owner, say) is signed straight back out with a message.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private readonly inBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _session = signal<Session | null>(null);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _busy = signal(false);
  private readonly _error = signal<string | null>(null);

  /** The current access token, refreshed by Supabase; sent to both APIs. */
  readonly token = computed(() => this._session()?.access_token ?? null);
  readonly user = this._user.asReadonly();
  readonly busy = this._busy.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null && this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');
  readonly isSuperAdmin = computed(() => this._user()?.isSuperAdmin === true);

  /** Initials for the header avatar, derived rather than stored. */
  readonly initials = computed(() => {
    const name = this._user()?.name ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'T';
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  });

  /**
   * Restores a saved session before the first route is matched (run as an app initializer,
   * so the guard sees the real state rather than "signed out" for a moment).
   */
  public async init(): Promise<void> {
    // Server render (the login page): nobody is signed in there.
    if (!this.inBrowser) return;
    supabase.auth.onAuthStateChange((event, session) => {
      this._session.set(session);
      if (event === 'SIGNED_OUT') this._user.set(null);
    });
    const { data } = await supabase.auth.getSession();
    this._session.set(data.session);
    if (data.session) await this.loadUser();
  }

  /** Resolves once the attempt finishes either way; a failure is left in `error`. */
  public async login(email: string, password: string): Promise<void> {
    this._busy.set(true);
    this._error.set(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      this._error.set(error.message === 'Invalid login credentials' ? 'Email or password is incorrect' : error.message);
      this._busy.set(false);
      return;
    }
    this._session.set(data.session);
    const allowed = await this.loadUser();
    this._busy.set(false);
    if (allowed) void this.router.navigateByUrl('/dashboard');
  }

  public async logout(): Promise<void> {
    await supabase.auth.signOut();
    this._session.set(null);
    this._user.set(null);
    void this.router.navigateByUrl('/login');
  }

  /** Called by the interceptor when an API rejects the token. */
  public sessionExpired(): void {
    if (this._session() === null) return;
    void this.logout();
  }

  /**
   * Asks the marketing API who this is. Signs out only when the API says the account is not
   * allowed (401/403); an API that is merely down keeps the Supabase session, so trying again
   * later works without typing the password.
   */
  private async loadUser(): Promise<boolean> {
    try {
      this._user.set(await firstValueFrom(this.api.get<AuthUser>('/auth/me')));
      return true;
    } catch (e) {
      this._error.set((e as Error).message);
      this._user.set(null);
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 401 || status === 403) {
        await supabase.auth.signOut();
        this._session.set(null);
      }
      return false;
    }
  }
}
