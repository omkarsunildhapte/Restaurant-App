import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '@config/env.config.js';
import { ConfigError } from '@utils/app-error.utils.js';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

function need(value: string, name: string): string {
  if (!value) {
    throw new ConfigError(`API is not configured: set ${name} in backend/.env`);
  }
  return value;
}

/**
 * Client that acts as the signed-in user: every query and RPC goes through database RLS,
 * so permission checks live in Postgres, not here.
 */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(config.supabase.url, need(config.supabase.anonKey, 'SUPABASE_ANON_KEY'), {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

let admin: SupabaseClient | undefined;

/** Service-role client. Only for Auth admin calls (checking tokens, invite emails); bypasses RLS. */
export function adminClient(): SupabaseClient {
  admin ??= createClient(config.supabase.url, need(config.supabase.serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY'), noSession);
  return admin;
}
