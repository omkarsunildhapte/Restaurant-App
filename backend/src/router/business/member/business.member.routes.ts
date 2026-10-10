import { Router } from 'express';
import { businessMemberController } from '@controller/business/member/business.member.controller.js';

/** Mounted at /platform/v1 (signed in; the database checks the caller is owner/admin of the tenant). */
const router = Router();

router.post('/tenants/:tenantId/members', businessMemberController.invite);

export default router;
