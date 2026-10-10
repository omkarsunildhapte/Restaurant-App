import type { SupabaseClient } from '@supabase/supabase-js';
import { check } from '@utils/pg-error.utils.js';
import type { InviteMemberDto, InviteStatus } from '@type/dto/member.dto.js';

/** Memberships of a tenant. invite_member() checks the caller's role and the Admin rules itself. */
export const memberDao = {
  async invite(db: SupabaseClient, tenantId: string, dto: InviteMemberDto): Promise<InviteStatus> {
    return check(
      await db.rpc('invite_member', { p_tenant: tenantId, p_email: dto.email, p_role: dto.role, p_outlet: dto.outletId ?? null }),
    ) as InviteStatus;
  },

  async listWithProfiles(db: SupabaseClient, tenantId: string) {
    return check(
      await db
        .from('memberships')
        .select('id, role, outlet_id, is_active, created_at, profiles(email, full_name)')
        .eq('tenant_id', tenantId)
        .order('created_at'),
    );
  },
};
