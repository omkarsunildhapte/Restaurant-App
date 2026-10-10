import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { AuthStore } from '@app/core/auth.store';

/** Platform pages are for Super Admin only; salespeople go back to the CRM dashboard. */
export const superAdminGuard: CanMatchFn = () =>
  inject(AuthStore).isSuperAdmin() || inject(Router).parseUrl('/dashboard');
