import type { Application } from 'express';
import { requireSuperAdmin } from '@middleware/auth.middleware.js';
import { adminTenantController } from '@controller/admin/tenant/admin.tenant.controller.js';
import adminTenantRoutes from '@router/admin/tenant/admin.tenant.routes.js';
import adminPlanRoutes from '@router/admin/plan/admin.plan.routes.js';
import adminDashboardRoutes from '@router/admin/dashboard/admin.dashboard.routes.js';

/**
 * Platform Super Admin. Registered after the business routes, whose `/platform/v1` guard has
 * already signed the caller in; the Super Admin check below must stay first in this function.
 */
export function registerAdminRoutes(app: Application): void {
  app.use('/platform/v1/admin', requireSuperAdmin);
  app.use('/platform/v1/admin', adminDashboardRoutes);
  app.use('/platform/v1/admin', adminPlanRoutes);
  app.use('/platform/v1/admin', adminTenantRoutes);

  // Creating a restaurant predates the /admin prefix; Sales CRM's convert-lead calls this URL.
  app.post('/platform/v1/tenants', requireSuperAdmin, adminTenantController.create);
}
