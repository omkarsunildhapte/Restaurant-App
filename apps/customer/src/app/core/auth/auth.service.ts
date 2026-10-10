import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, defer, from, map } from 'rxjs';
import { RoutingService } from 'src/app/service/routing.service';
import { SUPABASE, SupabaseNotConfiguredError } from '../supabase.client';

/** Result shape for auth calls that must not throw (e.g. OTP). */
export interface AuthResult<T = unknown> {
  data: T | null;
  error: AuthError | Error | null;
}

/**
 * Supabase-backed auth. Supersedes the old Firebase (compat) AuthService and OtpService.
 * localStorage 'uid' / 'email' / 'displayName' are still written because the data
 * stubs and pages read them.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly client = inject(SUPABASE);
  private readonly sessionSubject = new BehaviorSubject<Session | null>(null);
  /** Current session as a signal (zoneless-friendly). */
  readonly session = signal<Session | null>(null);
  /** Emits the current Supabase session (null when signed out). */
  readonly session$: Observable<Session | null> = this.sessionSubject.asObservable();
  /** Resolves once the persisted session has been restored. */
  readonly ready: Promise<Session | null>;

  constructor(public routerLink: RoutingService) {
    const supabase = this.client;
    if (!supabase) {
      this.ready = Promise.resolve(null);
      return;
    }
    this.ready = supabase.auth.getSession().then(({ data }) => {
      this.setSession(data.session);
      return data.session;
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      this.setSession(session);
    });
  }

  get currentUser(): User | null {
    return this.sessionSubject.value?.user ?? null;
  }

  /** Current Supabase access token (for Bearer headers to our backend), or null. */
  get accessToken(): string | null {
    return this.sessionSubject.value?.access_token ?? null;
  }

  /** Email + password sign-in (login page). */
  login(email: string, password: string): Observable<User> {
    return defer(() => this.getClient().auth.signInWithPassword({ email, password })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.setSession(data.session);
        return data.user;
      })
    );
  }

  /** Email + password sign-up (register page). */
  register(name: string, email: string, password: string): Observable<User | null> {
    return defer(() =>
      this.getClient().auth.signUp({ email, password, options: { data: { display_name: name } } })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.user;
      })
    );
  }

  resetPassword(email: string): Observable<void> {
    return defer(() => this.getClient().auth.resetPasswordForEmail(email)).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /** Re-checks the current password, then sets the new one. */
  updatePassword(currentPassword: string, newPassword: string): Observable<void> {
    return defer(async () => {
      const client = this.getClient();
      const email = this.currentUser?.email;
      if (!email) throw new Error('Not signed in.');
      const reauth = await client.auth.signInWithPassword({ email, password: currentPassword });
      if (reauth.error) throw reauth.error;
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw error;
    });
  }

  /**
   * Sends an SMS OTP. Never throws; returns { error } instead.
   * Signed out: signInWithOtp({ phone }) (phone sign-up / sign-in).
   * Signed in (email user adding a phone): updateUser({ phone }) so the phone is
   * attached to the same account instead of creating a second user.
   */
  async sendOtp(phone: string): Promise<AuthResult> {
    try {
      const client = this.getClient();
      if (this.currentUser) {
        const { data, error } = await client.auth.updateUser({ phone });
        return { data, error };
      }
      const { data, error } = await client.auth.signInWithOtp({ phone });
      return { data, error };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  }

  /** Verifies the SMS OTP. Never throws; returns { error } instead. */
  async verifyOtp(phone: string, token: string): Promise<AuthResult<Session>> {
    try {
      const client = this.getClient();
      const type = this.currentUser ? 'phone_change' : 'sms';
      const { data, error } = await client.auth.verifyOtp({ phone, token, type });
      if (!error) this.setSession(data.session);
      return { data: data.session, error };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  }

  async signOut(): Promise<void> {
    if (this.isBrowser) localStorage.clear();
    if (this.client) {
      await this.client.auth.signOut();
    }
    this.setSession(null);
  }

  /** Kept for the account page: signs out and goes to the start route. */
  logout(): Observable<void> {
    return from(this.signOut().then(() => this.routerLink.navigateUrl('', undefined)));
  }

  /** Human-readable message for an auth error (used by pages for alerts). */
  static messageOf(error: unknown): string {
    if (error instanceof SupabaseNotConfiguredError) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Something went wrong. Please try again.';
  }

  private getClient() {
    if (!this.client) {
      if (!this.isBrowser) throw new Error('Supabase is browser-only and is not available during server rendering.');
      throw new SupabaseNotConfiguredError();
    }
    return this.client;
  }

  private setSession(session: Session | null): void {
    this.session.set(session);
    if (!this.isBrowser) {
      this.sessionSubject.next(session);
      return;
    }
    if (session?.user) {
      const user = session.user;
      localStorage.setItem('uid', user.id);
      localStorage.setItem('email', user.email ?? '');
      localStorage.setItem('displayName', (user.user_metadata?.['display_name'] as string) ?? '');
    } else {
      localStorage.removeItem('uid');
      localStorage.removeItem('email');
      localStorage.removeItem('displayName');
    }
    this.sessionSubject.next(session);
  }
}
