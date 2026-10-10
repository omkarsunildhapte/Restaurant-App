import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AuthError, Session } from '@supabase/supabase-js';
import { SupabaseService } from '@services/supabase/supabase.service';
import { AuthServiceError } from '@utils/errors/errors.util';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { SUPABASE_AUTH } from '@constants/supabase.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { LEGACY_STORAGE_KEYS } from '@constants/storage-keys.constants';

/**
 * Rider authentication (email + password) on Supabase Auth.
 *
 * State is a private writable signal exposed through read-only computed views (Rule 13). supabase-js
 * owns the stored session; this service never stores tokens itself. Browser-only: on the server
 * there is no client, so the session stays null.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly sessionState = signal<Session | null>(null);

  /** Current session; null when signed out, during SSR, or when Supabase is not configured. */
  readonly session = computed(() => this.sessionState());
  readonly userId = computed(() => this.sessionState()?.user.id ?? null);
  readonly email = computed(() => this.sessionState()?.user.email ?? '');
  readonly accessToken = computed(() => this.sessionState()?.access_token ?? null);
  readonly displayName = computed(() => {
    const name = this.sessionState()?.user.user_metadata?.[SUPABASE_AUTH.DISPLAY_NAME_KEY];
    return typeof name === 'string' ? name : '';
  });

  constructor() {
    const client = this.supabase.client;
    if (client) {
      client.auth.getSession().then(({ data }) => this.sessionState.set(data.session));
      client.auth.onAuthStateChange((_event, session) => this.sessionState.set(session));
    }
  }

  /** Reads the stored session (supabase-js restores it on first call). */
  async getSession(): Promise<Session | null> {
    const client = this.supabase.client;
    if (!client) {
      return null;
    }
    const { data } = await client.auth.getSession();
    this.sessionState.set(data.session);
    return data.session;
  }

  async login(email: string, password: string): Promise<Session> {
    const { data, error } = await this.supabase.require().auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      throw toAuthError(error, ERROR_MESSAGES.LOGIN_FAILED);
    }
    this.sessionState.set(data.session);
    return data.session;
  }

  /** Creates the account. Resolves null when the project requires e-mail confirmation first. */
  async register(name: string, email: string, password: string): Promise<Session | null> {
    const options = { data: { [SUPABASE_AUTH.DISPLAY_NAME_KEY]: name } };
    const { data, error } = await this.supabase.require().auth.signUp({ email, password, options });
    if (error) {
      throw toAuthError(error, ERROR_MESSAGES.REGISTRATION_FAILED);
    }
    this.sessionState.set(data.session);
    return data.session;
  }

  async resetPassword(email: string): Promise<void> {
    const redirectTo = `${this.document.location.origin}${APP_ROUTE_LINKS.LOGIN}`;
    const { error } = await this.supabase.require().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      throw toAuthError(error, ERROR_MESSAGES.RESET_FAILED);
    }
  }

  async logout(): Promise<void> {
    await this.supabase.client?.auth.signOut();
    this.sessionState.set(null);
  }

  /** Removes the localStorage keys the pre-Supabase app wrote (see LEGACY_STORAGE_KEYS). */
  clearLegacyState(): void {
    if (!this.isBrowser) {
      return;
    }
    const storage = this.document.defaultView?.localStorage;
    LEGACY_STORAGE_KEYS.forEach((key) => storage?.removeItem(key));
  }

  /** True when the error means the e-mail already has an account. */
  isEmailInUse(error: unknown): boolean {
    return error instanceof AuthServiceError && !!error.code && SUPABASE_AUTH.USER_EXISTS_CODES.includes(error.code);
  }
}

function toAuthError(error: AuthError | null, fallback: string): AuthServiceError {
  return new AuthServiceError(error?.message || fallback, error?.code);
}
