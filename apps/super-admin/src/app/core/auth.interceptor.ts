import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '@app/core/auth.store';

/**
 * Attaches the Supabase access token, and signs out when an API says it is no longer valid.
 *
 * Skips /auth/me: that call is the sign-in check itself, and AuthStore handles its answer
 * (showing why an account has no access) instead of bouncing to the login page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const token = auth.token();

  const request = token ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      const status = (error as { status?: number }).status;
      const isWhoAmI = req.url.endsWith('/auth/me');

      if (status === 401 && !isWhoAmI) {
        auth.sessionExpired();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
