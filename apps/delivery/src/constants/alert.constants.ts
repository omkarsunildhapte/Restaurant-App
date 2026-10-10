import { AlertKind } from '@appTypes/alert.types';

/** AlertController / ToastController settings used by AlertService. */
export const ALERT = {
  CSS_CLASS: { success: 'alert-success', error: 'alert-error', warning: 'alert-warning' } satisfies Record<AlertKind, string>,
  OK_TEXT: 'OK',
  OK_ROLE: 'confirm',
  OK_CSS_CLASS: 'alert-button-ok',
  TOAST_DURATION_MS: 2500,
  TOAST_POSITION: 'bottom',
  TOAST_COLOR: 'medium',
} as const;
