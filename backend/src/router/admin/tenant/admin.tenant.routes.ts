import { Router } from 'express';
import { adminTenantController } from '@controller/admin/tenant/admin.tenant.controller.js';

/** Mounted at /platform/v1/admin (Super Admin). */
const router = Router();

router.get('/tenants', adminTenantController.list);
router.get('/tenants/:id', adminTenantController.detail);
router.patch('/tenants/:id', adminTenantController.updateSubscription);
router.put('/tenants/:id/notes', adminTenantController.saveNotes);

export default router;
