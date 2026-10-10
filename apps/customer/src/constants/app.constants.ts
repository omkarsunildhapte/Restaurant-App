/** App-wide values. */
export const APP = {
  NAME: 'Thaliyo',
  LOGO: 'brand/thaliyo-logo-600.webp',
  LOGO_WIDTH: 600,
  LOGO_HEIGHT: 465,
  EMBLEM: 'brand/thaliyo-emblem-256.png',
  EMBLEM_SIZE: 256,
} as const;

/** Money is shown in rupees. */
export const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
} as const;

/** Set on <html> once the client app has rendered (used by e2e tests). */
export const APP_READY = {
  ATTRIBUTE: 'data-app-ready',
  VALUE: 'true',
} as const;

/** Toast timing. */
export const UI_TIMING = {
  TOAST_DURATION_MS: 2500,
} as const;

/** Ionic overlay CSS classes and roles used from TypeScript. */
export const IONIC_UI = {
  ALERT_CLASS: { success: 'alert-success', error: 'alert-error', warning: 'alert-warning' },
  ALERT_OK_TEXT: 'OK',
  ALERT_OK_ROLE: 'confirm',
  ALERT_OK_CLASS: 'alert-button-ok',
  TOAST_POSITION: 'bottom',
  TOAST_COLOR: 'medium',
  EXTERNAL_TARGET: '_blank',
} as const;
