import { environment } from '@environments/environment';

/** The rider every e2e test signs in as. */
export const E2E_RIDER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'rider@thaliyo.test',
  name: 'Test Rider',
  password: 'correct-horse-battery',
};

/** One year from now, in seconds: supabase-js never tries to refresh a session this fresh. */
const expiresAt = () => Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

/** A session in the shape supabase-js stores and the Auth API returns. */
export function e2eSession() {
  return {
    access_token: 'e2e-access-token',
    refresh_token: 'e2e-refresh-token',
    token_type: 'bearer',
    expires_in: 365 * 24 * 60 * 60,
    expires_at: expiresAt(),
    user: {
      id: E2E_RIDER.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: E2E_RIDER.email,
      user_metadata: { display_name: E2E_RIDER.name },
      app_metadata: { provider: 'email' },
      created_at: new Date(0).toISOString(),
    },
  };
}

/** The localStorage key supabase-js uses: sb-<first label of the Supabase host>-auth-token. */
export const SUPABASE_STORAGE_KEY = `sb-${new URL(environment.supabase.url).hostname.split('.')[0]}-auth-token`;

/** The business the e2e rider delivers for: a `my_workspaces()` row with the delivery role. */
export const E2E_WORKSPACE = { tenant_id: '10000000-0000-4000-a000-000000000001', tenant_name: 'Brew & Leaf Café', tenant_slug: 'brew-leaf', role: 'delivery', outlet_id: null, status: 'active', trial_ends_at: null, plan_id: 'pro', features: {}, writable: true };
