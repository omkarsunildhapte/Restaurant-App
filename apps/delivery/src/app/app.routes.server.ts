import { RenderMode, ServerRoute } from '@angular/ssr';
import { APP_ROUTES, SIGNED_IN_ROUTES } from '@constants/routes.constants';

/**
 * Web SSR render modes (Rule 16).
 * - Signed-in screens are RenderMode.Client: they only make sense with the rider's session, which
 *   lives in the browser (Rule 8). track-map also needs a real DOM for the future map.
 * - Everything else (the public login/register/forgot screens) renders on the server.
 */
export const serverRoutes: ServerRoute[] = [
  ...SIGNED_IN_ROUTES.map((path): ServerRoute => ({ path, renderMode: RenderMode.Client })),
  { path: APP_ROUTES.WILDCARD, renderMode: RenderMode.Server },
];
