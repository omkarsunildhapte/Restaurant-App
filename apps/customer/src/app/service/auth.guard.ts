import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

/**
 * Allows the route only when a Supabase session exists; otherwise redirects to /login.
 * During SSR there is no session (it lives in the browser), so the server renders the page and
 * the guard runs again in the browser after hydration.
 */
export const authGuard: CanActivateFn = async () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = await auth.ready;
  if (!session && !auth.currentUser) {
    return router.parseUrl('/login');
  }
  return true;
};
