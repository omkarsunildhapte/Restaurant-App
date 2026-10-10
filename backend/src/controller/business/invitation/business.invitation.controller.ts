import type { Request, Response } from 'express';
import { caller } from '@middleware/auth.middleware.js';
import { invitationService } from '@service/invitation/invitation.service.js';
import { idParamSchema } from '@type/dto/tenant.dto.js';

export class BusinessInvitationController {
  /** POST /platform/v1/invitations/:id/resend: owner/admin sends the email again. */
  public resend = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    await invitationService.resend(caller(req).db, id);
    res.json({ status: 'sent' });
  };
}

export const businessInvitationController = new BusinessInvitationController();
