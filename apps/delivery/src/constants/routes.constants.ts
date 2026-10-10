/** Route path segments, as used in app.routes.ts. URLs are unchanged from the original app. */
export const APP_ROUTES = {
  REGISTER: 'register',
  LOGIN: 'login',
  FORGOT_PASSWORD: 'forget',
  PERSONAL_INFORMATION: 'personal-information',
  PERSONAL_DOCUMENT: 'personal-document',
  VEHICLE_DETAILS: 'vehicle-details',
  BANK_DETAILS: 'backing-details',
  ORDER: 'order',
  ACCOUNT: 'account',
  TRACK_MAP: 'track-map',
  WILDCARD: '**',
} as const;

/** Absolute links for [routerLink] and programmatic navigation. */
export const APP_ROUTE_LINKS = {
  REGISTER: `/${APP_ROUTES.REGISTER}`,
  LOGIN: `/${APP_ROUTES.LOGIN}`,
  FORGOT_PASSWORD: `/${APP_ROUTES.FORGOT_PASSWORD}`,
  PERSONAL_INFORMATION: `/${APP_ROUTES.PERSONAL_INFORMATION}`,
  PERSONAL_DOCUMENT: `/${APP_ROUTES.PERSONAL_DOCUMENT}`,
  VEHICLE_DETAILS: `/${APP_ROUTES.VEHICLE_DETAILS}`,
  BANK_DETAILS: `/${APP_ROUTES.BANK_DETAILS}`,
  ORDER: `/${APP_ROUTES.ORDER}`,
  ACCOUNT: `/${APP_ROUTES.ACCOUNT}`,
  TRACK_MAP: `/${APP_ROUTES.TRACK_MAP}`,
} as const;

/** Every signed-in route, in onboarding order (the e2e navigation spec walks this list). */
export const SIGNED_IN_ROUTES = [
  APP_ROUTES.PERSONAL_INFORMATION,
  APP_ROUTES.PERSONAL_DOCUMENT,
  APP_ROUTES.VEHICLE_DETAILS,
  APP_ROUTES.BANK_DETAILS,
  APP_ROUTES.ORDER,
  APP_ROUTES.ACCOUNT,
  APP_ROUTES.TRACK_MAP,
] as const;

/** Public (signed-out) routes; rendered on the server for the web build. */
export const PUBLIC_ROUTES = [APP_ROUTES.REGISTER, APP_ROUTES.LOGIN, APP_ROUTES.FORGOT_PASSWORD] as const;
