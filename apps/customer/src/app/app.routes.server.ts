import { RenderMode, ServerRoute } from '@angular/ssr';
import { APP_ROUTES } from '@constants/routes.constants';

const main = (segment: string): string => `${APP_ROUTES.MAIN}/${segment}`;

/**
 * Web SSR render modes (Rule 16). Default: RenderMode.Server. The Supabase session lives only in
 * the browser, so authGuard lets the server render and re-checks in the browser. RenderMode.Client
 * for screens that show or change the signed-in user's own data (account, cart, order, tracking,
 * phone/OTP, delivery address): on the server they would only be an empty, user-less shell.
 */
export const serverRoutes: ServerRoute[] = [
  ...[
    main(APP_ROUTES.ACCOUNT),
    main(APP_ROUTES.ACCOUNT_INFORMATION),
    main(APP_ROUTES.CHANGE_PASSWORD),
    main(APP_ROUTES.PAYMENT_METHODS),
    main(APP_ROUTES.HISTORY),
    main(APP_ROUTES.CART),
    main(APP_ROUTES.CONFIRM_ORDER),
    main(APP_ROUTES.TRACK),
    main(APP_ROUTES.TABLE_CONFIRM),
    APP_ROUTES.PHONE_NUMBER,
    APP_ROUTES.OTP,
    APP_ROUTES.LOCATION,
  ].map((path): ServerRoute => ({ path, renderMode: RenderMode.Client })),
  { path: APP_ROUTES.WILDCARD, renderMode: RenderMode.Server },
];
