import type { Application } from 'express';
import { registerPublicRoutes } from '@config/routes/public.routes.js';
import { registerBusinessRoutes } from '@config/routes/business.routes.js';
import { registerAdminRoutes } from '@config/routes/admin.routes.js';

/**
 * Wires the API onto the Express app, split by audience: public (no sign-in), business
 * (signed-in staff), admin (Super Admin). Which rule protects an endpoint is answered by which
 * file it is in. Order matters: business registers the sign-in guard that admin relies on.
 */
export class RouteManager {
  public static register(app: Application): void {
    registerPublicRoutes(app);
    registerBusinessRoutes(app);
    registerAdminRoutes(app);
  }
}
