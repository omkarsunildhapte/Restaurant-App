import type { Request, Response } from 'express';
import { caller } from '@middleware/auth.middleware.js';
import { dashboardService } from '@service/dashboard/dashboard.service.js';

export class AdminDashboardController {
  /** GET /platform/v1/admin/stats: restaurants by status, MRR, trials ending, recent sign-ups. */
  public stats = async (req: Request, res: Response): Promise<void> => {
    res.json(await dashboardService.stats(caller(req).db));
  };
}

export const adminDashboardController = new AdminDashboardController();
