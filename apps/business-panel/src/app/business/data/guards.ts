import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import type { TenantRole } from './db';
import { WorkspaceStore } from './workspace.store';

/**
 * Signed in, and part of at least one open business. Lets server rendering through:
 * sessions live in the browser, so the real check happens after hydration.
 */
export const businessGuard: CanActivateFn = async () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  const auth = inject(AuthService);
  const store = inject(WorkspaceStore);
  const router = inject(Router);

  await auth.ready;
  if (!auth.isSignedIn()) return router.createUrlTree(['/login']);
  try {
    await store.ensureLoaded();
  } catch {
    return router.createUrlTree(['/business/no-access']);
  }
  return store.current() ? true : router.createUrlTree(['/business/no-access']);
};

/** Only these roles; everyone else goes to the menu, which every role may read. */
export function roleGuard(...roles: TenantRole[]): CanActivateFn {
  return () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
    const role = inject(WorkspaceStore).role();
    return (role !== null && roles.includes(role)) || inject(Router).createUrlTree(['/business/menu']);
  };
}
