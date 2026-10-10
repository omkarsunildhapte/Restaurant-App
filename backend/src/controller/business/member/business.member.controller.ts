import type { Request, Response } from 'express';
import { caller } from '@middleware/auth.middleware.js';
import { memberService } from '@service/member/member.service.js';
import { HttpStatus } from '@type/utils/app-error.enum.js';
import { inviteMemberSchema, tenantIdParamSchema } from '@type/dto/member.dto.js';

export class BusinessMemberController {
  /** POST /platform/v1/tenants/:tenantId/members: owner/admin adds or invites a person. */
  public invite = async (req: Request, res: Response): Promise<void> => {
    const { tenantId } = tenantIdParamSchema.parse(req.params);
    const dto = inviteMemberSchema.parse(req.body);
    const status = await memberService.invite(caller(req).db, tenantId, dto);
    res.status(status === 'already_member' ? HttpStatus.OK : HttpStatus.CREATED).json({ status });
  };
}

export const businessMemberController = new BusinessMemberController();
