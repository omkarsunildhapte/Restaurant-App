import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

/**
 * Allows the route only with a Supabase session; otherwise redirects to /login.
 * During SSR there is no session (auth is browser-only), so the server renders the route and the
 * browser's initial navigation runs this guard again with the real session.
 */
export const authGuard: CanActivateFn = async () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }
  const router = inject(Router);
  const session = await inject(AuthService).getSession();
  return session ? true : router.createUrlTree(['/login']);
};
