import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Web SSR render modes. Default: RenderMode.Server.
 *
 * The Supabase session lives only in the browser (localStorage), so the server can't know who
 * the user is. authGuard therefore lets the server render guarded routes, and re-checks in the
 * browser after hydration (an anonymous visitor is then sent to /login).
 *
 * RenderMode.Client is used for pages that show or change the signed-in user's own data
 * (account, cart, order, tracking, phone/OTP, delivery address). Rendering them on the server
 * would only produce an empty, user-less shell and then flash, so they render in the browser.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'main/account', renderMode: RenderMode.Client },
  { path: 'main/account-information', renderMode: RenderMode.Client },
  { path: 'main/change-password', renderMode: RenderMode.Client },
  { path: 'main/payment-method', renderMode: RenderMode.Client },
  { path: 'main/histroy', renderMode: RenderMode.Client },
  { path: 'main/add-cart', renderMode: RenderMode.Client },
  { path: 'main/confirm-order', renderMode: RenderMode.Client },
  { path: 'main/track', renderMode: RenderMode.Client },
  { path: 'main/table-confirm', renderMode: RenderMode.Client },
  { path: 'phonenumber', renderMode: RenderMode.Client },
  { path: 'otp', renderMode: RenderMode.Client },
  { path: 'location', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
