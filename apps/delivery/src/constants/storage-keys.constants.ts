/**
 * localStorage keys the pre-Supabase app wrote (uid, e-mail, name, token). Nothing writes them any
 * more; the auth guard removes them when it rejects, so stale values from an old install go away.
 */
export const LEGACY_STORAGE_KEYS = ['uid', 'email', 'displayName', 'accessToken'] as const;
