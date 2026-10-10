import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { AuthError, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, defer, from, map } from 'rxjs';
import { RoutingService } from 'src/app/service/routing.service';
import { supabase, requireSupabase } from '../supabase.client';

/** Error thrown by AuthService. `code` mirrors Supabase's error code when there is one. */
export class AuthServiceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

/**
 * Rider authentication (email + password) backed by Supabase Auth.
 * Replaces the old Firebase Auth based src/app/service/auth.service.ts with the same methods.
 *
 * The 'uid', 'email' and 'displayName' localStorage keys are still written on sign-in because
 * the onboarding pages read 'uid' from there.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** False during SSR: no session, no localStorage, no Supabase client on the server. */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly sessionSubject = new BehaviorSubject<Session | null>(null);

  /** Current session; null when signed out or when Supabase is not configured. */
  readonly session$: Observable<Session | null> = this.sessionSubject.asObservable();

  constructor(private routerLink: RoutingService) {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => this.setSession(data.session));
      supabase.auth.onAuthStateChange((_event, session) => this.setSession(session));
    }
  }

  /** Resolves the current session (reads it from storage on first call). */
  async getSession(): Promise<Session | null> {
    if (!supabase) {
      return null;
    }
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  login(email: string, password: string): Observable<Session> {
    return defer(() =>
      from(requireSupabase().auth.signInWithPassword({ email, password })),
    ).pipe(
      map(({ data, error }) => {
        if (error || !data.session) {
          throw toAuthError(error, 'Login failed.');
        }
        this.setSession(data.session);
        return data.session;
      }),
    );
  }

  /** Creates the account. `session` is null when the project requires e-mail confirmation. */
  register(name: string, email: string, password: string): Observable<Session | null> {
    return defer(() =>
      from(
        requireSupabase().auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        }),
      ),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw toAuthError(error, 'Registration failed.');
        }
        this.setSession(data.session);
        return data.session;
      }),
    );
  }

  resetPassword(email: string): Observable<void> {
    return defer(() =>
      from(
        requireSupabase().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        }),
      ),
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw toAuthError(error, 'Could not send the reset e-mail.');
        }
      }),
    );
  }

  logout(): Observable<void> {
    return defer(async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }
      this.setSession(null);
      this.routerLink.navigateUrl('', undefined);
    });
  }

  private setSession(session: Session | null): void {
    if (!this.isBrowser) {
      return;
    }
    if (session) {
      localStorage.setItem('uid', session.user.id);
      localStorage.setItem('email', session.user.email ?? '');
      localStorage.setItem('displayName', session.user.user_metadata?.['display_name'] ?? '');
    } else {
      localStorage.removeItem('uid');
      localStorage.removeItem('email');
      localStorage.removeItem('displayName');
      localStorage.removeItem('accessToken');
    }
    this.sessionSubject.next(session);
  }
}

function toAuthError(error: AuthError | null, fallback: string): AuthServiceError {
  return new AuthServiceError(error?.message || fallback, error?.code);
}
