import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * The one Supabase client for the app. It keeps the session in localStorage and refreshes
 * the access token before it expires; AuthStore mirrors that session into signals.
 * Sign-in is Supabase Auth for every API: the Python marketing API and the Node platform
 * API both accept this same access token.
 */
const inBrowser = typeof window !== 'undefined';

// On the server (SSR) there is no signed-in user: no stored session, no refresh timer.
export const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
  auth: { persistSession: inBrowser, autoRefreshToken: inBrowser, detectSessionInUrl: inBrowser, storageKey: 'rp-console.auth' },
});
