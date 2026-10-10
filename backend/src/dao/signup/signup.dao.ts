import { adminClient } from '@config/supabase.config.js';
import { check } from '@utils/pg-error.utils.js';
import type { SignupDto } from '@type/dto/signup.dto.js';

/** Pending sign-ups (service role: the website visitor is not signed in). */
export const signupDao = {
  async create(dto: SignupDto): Promise<string> {
    const row = check(
      await adminClient()
        .from('signups')
        .insert({
          restaurant_name: dto.restaurantName,
          owner_name: dto.ownerName,
          email: dto.email,
          phone: dto.phone ?? null,
          city: dto.city ?? null,
          plan_id: dto.planId,
          source: dto.source ?? 'website',
        })
        .select('id')
        .single(),
    ) as { id: string };
    return row.id;
  },

  async remove(id: string): Promise<void> {
    check(await adminClient().from('signups').delete().eq('id', id));
  },
};
