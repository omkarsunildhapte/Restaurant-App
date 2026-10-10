import type { SupabaseClient } from '@supabase/supabase-js';
import { tenantDao } from '@dao/tenant/tenant.dao.js';
import { memberDao } from '@dao/member/member.dao.js';
import { invitationDao } from '@dao/invitation/invitation.dao.js';
import { authAdminDao } from '@dao/auth/auth-admin.dao.js';
import { AppError } from '@utils/app-error.utils.js';
import type { CreateTenantDto, CreateTenantResult, ListTenantsQuery, UpdateSubscriptionDto } from '@type/dto/tenant.dto.js';

/** Restaurants on the platform: creating them (assisted onboarding) and their subscription. */
export const tenantService = {
  /** Tenant + first outlet + GST rates in the database; the owner is emailed if they have no account. */
  async create(db: SupabaseClient, dto: CreateTenantDto): Promise<CreateTenantResult> {
    const result = await tenantDao.create(db, dto);
    if (result.owner === 'invited') {
      await authAdminDao.inviteByEmail(dto.ownerEmail, dto.ownerName);
    }
    return result;
  },

  async list(db: SupabaseClient, query: ListTenantsQuery) {
    const rows = await tenantDao.list(db, query);
    return rows.map(({ outlets, memberships, ...tenant }) => ({
      ...tenant,
      outlet_count: outlets[0]?.count ?? 0,
      staff_count: memberships[0]?.count ?? 0,
    }));
  },

  async detail(db: SupabaseClient, id: string) {
    const [tenant, outlets, members, invitations, notes, features] = await Promise.all([
      tenantDao.findById(db, id),
      tenantDao.outlets(db, id),
      memberDao.listWithProfiles(db, id),
      invitationDao.listPending(db, id),
      tenantDao.notes(db, id),
      tenantDao.features(db, id),
    ]);
    if (!tenant) throw AppError.notFound('Restaurant not found');
    return { tenant, features, outlets, members, invitations, notes };
  },

  async updateSubscription(db: SupabaseClient, id: string, dto: UpdateSubscriptionDto) {
    const row = await tenantDao.updateSubscription(db, id, dto);
    if (!row) throw AppError.notFound('Restaurant not found');
    return row;
  },

  async saveNotes(db: SupabaseClient, id: string, notes: string): Promise<{ notes: string }> {
    await tenantDao.saveNotes(db, id, notes);
    return { notes };
  },
};
