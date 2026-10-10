import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { AuthStore } from '@app/core/auth.store';

/**
 * Keeps the console behind a token. CanMatch rather than CanActivate so the shell's lazy
 * chunk is never even fetched for a signed-out visitor.
 */
export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};

/** Sends an already-signed-in visitor away from the login screen. */
export const guestGuard: CanMatchFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;
  return router.createUrlTree(['/dashboard']);
};
