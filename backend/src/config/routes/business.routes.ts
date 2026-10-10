import type { Application } from 'express';
import { requireUser } from '@middleware/auth.middleware.js';
import businessMemberRoutes from '@router/business/member/business.member.routes.js';
import businessInvitationRoutes from '@router/business/invitation/business.invitation.routes.js';
import businessGeocodeRoutes from '@router/business/geocode/business.geocode.routes.js';

/**
 * Restaurant staff (owners, admins, managers). The guard is on the prefix, so a route added under
 * it cannot forget sign-in; which business and role may act is then decided by the database.
 */
export function registerBusinessRoutes(app: Application): void {
  app.use('/platform/v1', requireUser);
  app.use('/platform/v1', businessMemberRoutes);
  app.use('/platform/v1', businessInvitationRoutes);

  app.use('/geocode', requireUser, businessGeocodeRoutes);
}
