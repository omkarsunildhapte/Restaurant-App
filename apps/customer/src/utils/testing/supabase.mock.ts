import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { vi } from 'vitest';
import { SUPABASE } from '@services/supabase/supabase.service';

/** A signed-in test user. */
export const TEST_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  phone: '',
  user_metadata: { display_name: 'Test User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
} as unknown as User;

export const TEST_SESSION = { access_token: 'token-123', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, user: TEST_USER } as unknown as Session;

/** The supabase.auth methods the app calls, all vi.fn(). No network. */
export function createAuthMock(session: Session | null = null) {
  return {
    getSession: vi.fn().mockResolvedValue({ data: { session } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
}

export type AuthMock = ReturnType<typeof createAuthMock>;

/** A minimal SupabaseClient double for the SUPABASE token. */
export function createSupabaseMock(session: Session | null = null): { client: SupabaseClient; auth: AuthMock } {
  const auth = createAuthMock(session);
  return { client: { auth } as unknown as SupabaseClient, auth };
}

/** Provider for the SUPABASE loader token with a fake client (or null = not configured / server). */
export function provideSupabase(client: SupabaseClient | null) {
  return { provide: SUPABASE, useValue: () => Promise.resolve(client) };
}
