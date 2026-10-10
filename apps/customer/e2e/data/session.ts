/**
 * The signed-in customer the stubbed Supabase knows about, and how supabase-js stores a session.
 */

/** Matches environment.supabase.url (development). */
export const SUPABASE_URL = 'http://127.0.0.1:54321';

/** supabase-js stores the session under sb-<first host label>-auth-token. */
export const SESSION_STORAGE_KEY = 'sb-127-auth-token';

export const E2E_USER = {
  id: '00000000-0000-0000-0000-0000000000e2',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'asha@example.com',
  phone: '',
  app_metadata: { provider: 'email' },
  user_metadata: { display_name: 'Asha Rao' },
  created_at: '2026-01-01T00:00:00Z',
};

/** A session that stays valid for an hour, so supabase-js never tries to refresh it. */
export function e2eSession(user = E2E_USER) {
  const now = Math.floor(Date.now() / 1000);
  return { access_token: 'e2e-access-token', refresh_token: 'e2e-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, user };
}
