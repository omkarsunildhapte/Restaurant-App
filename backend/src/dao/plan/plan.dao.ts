import type { SupabaseClient } from '@supabase/supabase-js';
import { check } from '@utils/pg-error.utils.js';
import type { UpdatePlanDto } from '@type/dto/tenant.dto.js';

/** Plans: everyone signed in reads; RLS lets only Super Admin write. */
export const planDao = {
  async list(db: SupabaseClient) {
    return check(await db.from('plans').select('*').order('sort_order'));
  },

  async update(db: SupabaseClient, id: string, dto: UpdatePlanDto) {
    return check(
      await db
        .from('plans')
        .update({
          name: dto.name,
          price_monthly: dto.priceMonthly,
          max_outlets: dto.maxOutlets,
          features: dto.features,
          is_active: dto.isActive,
        })
        .eq('id', id)
        .select()
        .maybeSingle(),
    );
  },
};
