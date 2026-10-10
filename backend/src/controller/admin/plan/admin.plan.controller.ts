import type { Request, Response } from 'express';
import { z } from 'zod';
import { caller } from '@middleware/auth.middleware.js';
import { planService } from '@service/plan/plan.service.js';
import { updatePlanSchema } from '@type/dto/tenant.dto.js';

export class AdminPlanController {
  /** GET /platform/v1/admin/plans */
  public list = async (req: Request, res: Response): Promise<void> => {
    res.json(await planService.list(caller(req).db));
  };

  /** PATCH /platform/v1/admin/plans/:id: price, outlet limit, features, offered or not. */
  public update = async (req: Request, res: Response): Promise<void> => {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const dto = updatePlanSchema.parse(req.body);
    res.json(await planService.update(caller(req).db, id, dto));
  };
}

export const adminPlanController = new AdminPlanController();
