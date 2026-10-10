import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@environments/environment';
import { AuthService } from '@services/auth/auth.service';
import { AUTH_HEADER, BEARER_PREFIX } from '@constants/http.constants';

/**
 * Adds the Supabase access token as a Bearer header, only to requests for environment.apiUrl
 * (Rule 17): never to storage signed URLs, map tiles or any other third party.
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).accessToken();
  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { [AUTH_HEADER]: `${BEARER_PREFIX}${token}` } }));
};
