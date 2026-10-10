import { Router } from 'express';
import { adminPlanController } from '@controller/admin/plan/admin.plan.controller.js';

/** Mounted at /platform/v1/admin (Super Admin). */
const router = Router();

router.get('/plans', adminPlanController.list);
router.patch('/plans/:id', adminPlanController.update);

export default router;
