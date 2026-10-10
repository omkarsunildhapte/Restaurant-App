import type { Request, Response } from 'express';
import { signupService } from '@service/signup/signup.service.js';
import { HttpStatus } from '@type/utils/app-error.enum.js';
import { signupSchema } from '@type/dto/signup.dto.js';

export class PublicSignupController {
  /** POST /public/v1/signups: records the sign-up and emails the owner a link to set a password. */
  public create = async (req: Request, res: Response): Promise<void> => {
    const dto = signupSchema.parse(req.body);
    await signupService.start(dto);
    res.status(HttpStatus.ACCEPTED).json({ status: 'check_email' });
  };
}

export const publicSignupController = new PublicSignupController();
