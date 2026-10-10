import type { SupabaseClient } from '@supabase/supabase-js';
import { invitationDao } from '@dao/invitation/invitation.dao.js';
import { authAdminDao } from '@dao/auth/auth-admin.dao.js';
import { AppError } from '@utils/app-error.utils.js';

export const invitationService = {
  /** Sends a pending invitation's email again (read through RLS, so only that tenant's owners). */
  async resend(db: SupabaseClient, id: string): Promise<void> {
    const invitation = await invitationDao.findById(db, id);
    if (!invitation) throw AppError.notFound('Invitation not found');
    if (invitation.accepted_at) throw AppError.conflict('This invitation was already accepted');
    await invitationDao.renew(db, id);
    await authAdminDao.inviteByEmail(invitation.email);
  },
};
