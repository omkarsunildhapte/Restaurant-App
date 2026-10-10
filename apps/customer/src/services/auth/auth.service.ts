import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { AuthResult } from '@appTypes/auth.types';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { OTP_TYPES, USER_METADATA } from '@constants/supabase.constants';
import { SUPABASE, SupabaseNotConfiguredError } from '@services/supabase/supabase.service';

/**
 * Supabase auth (email + password, phone OTP). State lives in a private signal exposed read-only
 * (Rule 13). Methods return Promises; OTP methods never throw and return `{ error }` instead.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly client: Promise<SupabaseClient | null> = inject(SUPABASE)();
  private readonly sessionState = signal<Session | null>(null);

  /** Current Supabase session (null when signed out or on the server). */
  readonly session = computed(() => this.sessionState());
  readonly currentUser = computed<User | null>(() => this.sessionState()?.user ?? null);
  readonly accessToken = computed<string | null>(() => this.sessionState()?.access_token ?? null);
  readonly displayName = computed<string>(() => {
    const name = this.currentUser()?.user_metadata?.[USER_METADATA.DISPLAY_NAME];
    return typeof name === 'string' ? name : '';
  });

  /** Resolves once the persisted session has been restored (null on the server). */
  readonly ready: Promise<Session | null> = this.client.then(async (client) => {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    this.sessionState.set(data.session);
    client.auth.onAuthStateChange((_event, session) => this.sessionState.set(session));
    return data.session;
  });

  /** Email + password sign-in. */
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await (await this.getClient()).auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.sessionState.set(data.session);
    return data.user;
  }

  /** Email + password sign-up. */
  async register(name: string, email: string, password: string): Promise<User | null> {
    const { data, error } = await (await this.getClient()).auth.signUp({ email, password, options: { data: { [USER_METADATA.DISPLAY_NAME]: name } } });
    if (error) throw error;
    return data.user;
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await (await this.getClient()).auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  /** Re-checks the current password, then sets the new one. */
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const client = await this.getClient();
    const email = this.currentUser()?.email;
    if (!email) throw new Error(ERROR_MESSAGES.NOT_SIGNED_IN);
    const reauth = await client.auth.signInWithPassword({ email, password: currentPassword });
    if (reauth.error) throw reauth.error;
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  /**
   * Sends an SMS OTP. Signed out: signInWithOtp({ phone }). Signed in (an email user adding a phone):
   * updateUser({ phone }), so the phone joins the same account instead of creating a second user.
   */
  async sendOtp(phone: string): Promise<AuthResult> {
    try {
      const client = await this.getClient();
      const { data, error } = this.currentUser() ? await client.auth.updateUser({ phone }) : await client.auth.signInWithOtp({ phone });
      return { data, error };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  }

  /** Verifies the SMS OTP. */
  async verifyOtp(phone: string, token: string): Promise<AuthResult<Session>> {
    try {
      const client = await this.getClient();
      const type = this.currentUser() ? OTP_TYPES.PHONE_CHANGE : OTP_TYPES.SMS;
      const { data, error } = await client.auth.verifyOtp({ phone, token, type });
      if (!error) this.sessionState.set(data.session);
      return { data: data.session, error };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  }

  async signOut(): Promise<void> {
    const client = await this.client;
    if (client) await client.auth.signOut();
    this.sessionState.set(null);
  }

  private async getClient(): Promise<SupabaseClient> {
    const client = await this.client;
    if (!client) {
      if (!this.isBrowser) throw new Error(ERROR_MESSAGES.SUPABASE_SERVER_ONLY);
      throw new SupabaseNotConfiguredError();
    }
    return client;
  }
}
