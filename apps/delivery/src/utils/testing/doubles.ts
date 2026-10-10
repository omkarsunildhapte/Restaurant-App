import { signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';

/** A Supabase session for unit tests. */
export function fakeSession(overrides: { id?: string; email?: string; name?: string; token?: string } = {}): Session {
  return {
    access_token: overrides.token ?? 'test-token',
    refresh_token: 'test-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 9999999999,
    user: {
      id: overrides.id ?? 'rider-1',
      email: overrides.email ?? 'rider@thaliyo.test',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: overrides.name === undefined ? { display_name: 'Test Rider' } : { display_name: overrides.name },
      created_at: new Date(0).toISOString(),
    },
  };
}

/** The supabase-js auth methods the app calls, as vi.fn()s. */
export function fakeSupabaseAuth() {
  return {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithPassword: vi.fn(),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
}

/** A SupabaseService stand-in whose client is only the auth API. */
export function fakeSupabaseService(auth = fakeSupabaseAuth()) {
  const client = { auth };
  return { client, configError: null, require: () => client, auth };
}

/** An AuthService stand-in driven by a session signal. */
export function fakeAuthService(session: Session | null = fakeSession()) {
  const state = signal<Session | null>(session);
  return {
    state,
    session: state.asReadonly(),
    userId: () => state()?.user.id ?? null,
    email: () => state()?.user.email ?? '',
    accessToken: () => state()?.access_token ?? null,
    displayName: () => (state()?.user.user_metadata?.['display_name'] as string | undefined) ?? '',
    getSession: vi.fn(async () => state()),
    login: vi.fn(async () => fakeSession()),
    updatePassword: vi.fn(async () => undefined),
    resetPassword: vi.fn(async () => undefined),
    logout: vi.fn(async () => state.set(null)),
    clearLegacyState: vi.fn(),
  };
}

/** AlertService stand-in. */
export function fakeAlertService() {
  return { presentAlert: vi.fn(async () => undefined), presentError: vi.fn(async () => undefined), notConnectedYet: vi.fn(async () => undefined), saveFailed: vi.fn(async () => undefined) };
}

/** NavigationService stand-in. */
export function fakeNavigationService() {
  return { forward: vi.fn(async () => true), root: vi.fn(async () => true) };
}
