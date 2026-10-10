import type { SupabaseClient } from '@supabase/supabase-js';
import { check } from '@utils/pg-error.utils.js';

/** Pending invitations. RLS: owners and admins of the tenant only. */
export const invitationDao = {
  async findById(db: SupabaseClient, id: string) {
    return check(await db.from('invitations').select('email, accepted_at, expires_at').eq('id', id).maybeSingle()) as {
      email: string;
      accepted_at: string | null;
      expires_at: string;
    } | null;
  },

  async listPending(db: SupabaseClient, tenantId: string) {
    return check(
      await db
        .from('invitations')
        .select('id, email, role, outlet_id, created_at, expires_at')
        .eq('tenant_id', tenantId)
        .is('accepted_at', null)
        .order('created_at'),
    );
  },

  /** Another 7 days before the email goes out again. */
  async renew(db: SupabaseClient, id: string): Promise<void> {
    check(await db.rpc('renew_invitation', { p_invitation: id }));
  },
};
