import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@services/auth/auth.service';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';

/**
 * Lets a signed-in route through only with a real Supabase session; otherwise clears the
 * pre-Supabase localStorage keys and redirects to /login.
 *
 * The guarded routes are RenderMode.Client, so this normally runs only in the browser; on the
 * server (no session exists there) it lets the render through and the browser decides.
 */
export const authGuard: CanActivateFn = async () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }
  const router = inject(Router);
  const auth = inject(AuthService);
  const session = await auth.getSession();
  if (session) {
    return true;
  }
  auth.clearLegacyState();
  return router.createUrlTree([APP_ROUTE_LINKS.LOGIN]);
};
