import { z } from 'zod';

export const TENANT_STATUSES = ['trial', 'active', 'past_due', 'suspended', 'cancelled'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

const features = z.record(z.string(), z.boolean());

/** POST /platform/v1/tenants */
export const createTenantSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use lowercase letters, numbers and dashes'),
  ownerEmail: z.email(),
  ownerName: z.string().trim().max(120).optional(),
  planId: z.string().default('pro'),
  outletName: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  trialDays: z.number().int().min(0).max(90).default(14),
});
export type CreateTenantDto = z.infer<typeof createTenantSchema>;

export interface CreateTenantResult {
  tenant_id: string;
  outlet_id: string;
  owner: 'added' | 'invited';
}

/** GET /platform/v1/admin/tenants?status=&q= */
export const listTenantsQuerySchema = z.object({
  status: z.preprocess((v) => v || undefined, z.enum(TENANT_STATUSES).optional()),
  q: z.preprocess((v) => v || undefined, z.string().trim().max(80).optional()),
});
export type ListTenantsQuery = z.infer<typeof listTenantsQuerySchema>;

/** PATCH /platform/v1/admin/tenants/:id */
export const updateSubscriptionSchema = z.object({
  planId: z.string().optional(),
  status: z.enum(TENANT_STATUSES).optional(),
  trialEndsAt: z.iso.datetime({ offset: true }).nullable().optional(),
  featureOverrides: features.optional(),
});
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;

/** PUT /platform/v1/admin/tenants/:id/notes */
export const tenantNotesSchema = z.object({ notes: z.string().max(10_000) });

/** PATCH /platform/v1/admin/plans/:id */
export const updatePlanSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  priceMonthly: z.number().min(0).max(1_000_000).optional(),
  maxOutlets: z.number().int().min(1).nullable().optional(),
  features: features.optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;

export const idParamSchema = z.object({ id: z.uuid() });
