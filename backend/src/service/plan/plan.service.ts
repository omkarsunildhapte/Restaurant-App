import type { SupabaseClient } from '@supabase/supabase-js';
import { planDao } from '@dao/plan/plan.dao.js';
import { AppError } from '@utils/app-error.utils.js';
import type { UpdatePlanDto } from '@type/dto/tenant.dto.js';

/** Plan prices, outlet limits and feature switches. */
export const planService = {
  list: (db: SupabaseClient) => planDao.list(db),

  async update(db: SupabaseClient, id: string, dto: UpdatePlanDto) {
    const row = await planDao.update(db, id, dto);
    if (!row) throw AppError.notFound('Plan not found');
    return row;
  },
};
