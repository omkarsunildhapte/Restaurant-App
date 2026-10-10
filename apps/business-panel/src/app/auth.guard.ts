import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

/**
 * Redirects to /login when there is no Supabase session.
 * Allows rendering on the server (no session there) and never blocks /login itself.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  const auth = inject(AuthService);
  const router = inject(Router);
  if (state.url.startsWith('/login')) return true;
  await auth.ready;
  return auth.isSignedIn() ? true : router.createUrlTree(['/login']);
};
