import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { AuthService } from '@services/auth/auth.service';

/**
 * Allows the route only with a real Supabase session; otherwise redirects to /login. During SSR
 * there is no session (it lives in the browser), so the server renders and the guard runs again in
 * the browser after the app boots.
 */
export const authGuard: CanActivateFn = async () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = await auth.ready;
  return session || auth.currentUser() ? true : router.parseUrl(APP_ROUTE_LINKS.LOGIN);
};
