import type { SupabaseClient } from '@supabase/supabase-js';
import { check } from '@utils/pg-error.utils.js';
import type { CreateTenantDto, CreateTenantResult, ListTenantsQuery, UpdateSubscriptionDto } from '@type/dto/tenant.dto.js';

/** Tenant queries, run as the caller (RLS: Super Admin sees every tenant, owners only their own). */
export const tenantDao = {
  async create(db: SupabaseClient, dto: CreateTenantDto): Promise<CreateTenantResult> {
    return check(
      await db.rpc('create_tenant', {
        p_name: dto.name,
        p_slug: dto.slug,
        p_owner_email: dto.ownerEmail,
        p_plan_id: dto.planId,
        p_outlet_name: dto.outletName ?? null,
        p_city: dto.city ?? null,
        p_phone: dto.phone ?? null,
        p_trial_days: dto.trialDays,
      }),
    ) as CreateTenantResult;
  },

  async list(db: SupabaseClient, query: ListTenantsQuery) {
    let q = db
      .from('tenants')
      .select('id, name, slug, status, plan_id, trial_ends_at, phone, email, created_at, outlets(count), memberships(count)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (query.status) q = q.eq('status', query.status);
    if (query.q) {
      const term = query.q.replace(/[%,()]/g, '');
      q = q.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
    }
    return check(await q) as Array<Record<string, unknown> & { outlets: { count: number }[]; memberships: { count: number }[] }>;
  },

  async findById(db: SupabaseClient, id: string) {
    return check(await db.from('tenants').select('*').eq('id', id).maybeSingle());
  },

  async features(db: SupabaseClient, id: string) {
    return check(await db.rpc('tenant_features', { p_tenant: id }));
  },

  async updateSubscription(db: SupabaseClient, id: string, dto: UpdateSubscriptionDto) {
    return check(
      await db
        .from('tenants')
        .update({ plan_id: dto.planId, status: dto.status, trial_ends_at: dto.trialEndsAt, feature_overrides: dto.featureOverrides })
        .eq('id', id)
        .select()
        .maybeSingle(),
    );
  },

  async outlets(db: SupabaseClient, tenantId: string) {
    return check(
      await db.from('outlets').select('id, name, city, phone, is_active, created_at').eq('tenant_id', tenantId).order('created_at'),
    );
  },

  async notes(db: SupabaseClient, tenantId: string): Promise<string> {
    return (check(await db.from('tenant_notes').select('notes').eq('tenant_id', tenantId).maybeSingle()) as { notes: string } | null)?.notes ?? '';
  },

  async saveNotes(db: SupabaseClient, tenantId: string, notes: string): Promise<void> {
    check(await db.from('tenant_notes').upsert({ tenant_id: tenantId, notes, updated_at: new Date().toISOString() }));
  },

  async stats(db: SupabaseClient) {
    return check(await db.rpc('platform_stats'));
  },
};
