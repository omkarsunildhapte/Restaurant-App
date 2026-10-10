import type { SupabaseClient } from '@supabase/supabase-js';
import { memberDao } from '@dao/member/member.dao.js';
import { authAdminDao } from '@dao/auth/auth-admin.dao.js';
import type { InviteMemberDto, InviteStatus } from '@type/dto/member.dto.js';

/** Adding people to a business. */
export const memberService = {
  /**
   * Existing account → added now. New email → pending invitation in the database plus an invite
   * email; the account the email creates picks up the invitation (handle_new_user trigger).
   */
  async invite(db: SupabaseClient, tenantId: string, dto: InviteMemberDto): Promise<InviteStatus> {
    const status = await memberDao.invite(db, tenantId, dto);
    if (status === 'invited') {
      await authAdminDao.inviteByEmail(dto.email, dto.fullName);
    }
    return status;
  },
};
