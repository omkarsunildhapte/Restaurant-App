import { z } from 'zod';

export const TENANT_ROLES = ['admin', 'owner', 'manager', 'cashier', 'waiter', 'kitchen', 'delivery'] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

/** POST /platform/v1/tenants/:tenantId/members */
export const inviteMemberSchema = z.object({
  email: z.email(),
  role: z.enum(TENANT_ROLES),
  outletId: z.uuid().nullish(),
  fullName: z.string().trim().max(120).optional(),
});
export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;

export type InviteStatus = 'added' | 'invited' | 'already_member';

export const tenantIdParamSchema = z.object({ tenantId: z.uuid() });
