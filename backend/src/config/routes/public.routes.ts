import type { Application, Request, Response } from 'express';
import { config } from '@config/env.config.js';
import publicSignupRoutes from '@router/public/signup/public.signup.routes.js';

/** No sign-in: health check and the website's "Start free trial". Menus and themes come in Phase 8. */
export function registerPublicRoutes(app: Application): void {
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', env: config.appEnv });
  });

  app.use('/public/v1', publicSignupRoutes);
}
