import type { SupabaseClient } from '@supabase/supabase-js';
import { tenantDao } from '@dao/tenant/tenant.dao.js';

/** Platform numbers for the Super Admin overview (platform_stats() in the database). */
export const dashboardService = {
  stats: (db: SupabaseClient) => tenantDao.stats(db),
};
