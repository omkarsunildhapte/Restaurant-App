import { Router } from 'express';
import { adminDashboardController } from '@controller/admin/dashboard/admin.dashboard.controller.js';

/** Mounted at /platform/v1/admin (Super Admin). */
const router = Router();

router.get('/stats', adminDashboardController.stats);

export default router;
