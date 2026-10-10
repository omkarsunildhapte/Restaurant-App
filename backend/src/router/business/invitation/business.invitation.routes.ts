import { Router } from 'express';
import { businessInvitationController } from '@controller/business/invitation/business.invitation.controller.js';

/** Mounted at /platform/v1 (signed in; RLS limits invitations to the tenant's owners/admins). */
const router = Router();

router.post('/invitations/:id/resend', businessInvitationController.resend);

export default router;
