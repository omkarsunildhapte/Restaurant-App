import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { SessionStore } from '@app/core/session.store';
import type { Mode } from '@app/core/modes';

/** Signed in and working at an outlet; otherwise to login or the outlet chooser. */
export const workingGuard: CanMatchFn = () => {
  const s = inject(SessionStore);
  const router = inject(Router);
  if (!s.signedIn()) return router.createUrlTree(['/login']);
  if (!s.ready()) return router.createUrlTree(['/choose']);
  return true;
};

export const signedInGuard: CanMatchFn = () => {
  const s = inject(SessionStore);
  return s.signedIn() ? true : inject(Router).createUrlTree(['/login']);
};

export const guestGuard: CanMatchFn = () => {
  const s = inject(SessionStore);
  if (!s.signedIn()) return true;
  return inject(Router).createUrlTree([s.ready() ? s.home() : '/choose']);
};

/** Only roles that work in this screen, and only when the plan includes it. */
export const modeGuard = (mode: Mode): CanMatchFn => () => {
  const s = inject(SessionStore);
  return s.modes().includes(mode) ? true : inject(Router).createUrlTree([s.home()]);
};
