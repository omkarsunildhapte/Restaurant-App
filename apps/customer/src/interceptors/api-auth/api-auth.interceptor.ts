import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@environments/environment';
import { AUTH_HEADER } from '@constants/api.constants';
import { AuthService } from '@services/auth/auth.service';

/**
 * Adds the Supabase access token as a Bearer header — only to requests for our own backend
 * (environment.apiUrl), never to third-party URLs (Rule 17).
 */
export const apiAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.apiUrl || !req.url.startsWith(environment.apiUrl)) return next(req);
  const token = inject(AuthService).accessToken();
  return next(token ? req.clone({ setHeaders: { [AUTH_HEADER.NAME]: AUTH_HEADER.bearer(token) } }) : req);
};
