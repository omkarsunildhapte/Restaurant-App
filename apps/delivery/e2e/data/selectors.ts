/**
 * Selectors for the screens under test. Ionic renders the real <input> inside each <ion-input>,
 * so form fields are addressed through it.
 */
const ionInput = (testId: string) => `[data-testid="${testId}"] input`;
const byTestId = (testId: string) => `[data-testid="${testId}"]`;

export const LOGIN = {
  EMAIL: ionInput('login-email'),
  PASSWORD: ionInput('login-password'),
  SUBMIT: byTestId('login-submit'),
};

export const WELCOME = {
  PASSWORD: ionInput('welcome-password'),
  CONFIRM: ionInput('welcome-confirm'),
  SUBMIT: byTestId('welcome-submit'),
};

export const ALERT = {
  ROOT: 'ion-alert',
  MESSAGE: 'ion-alert .alert-message',
  OK: 'ion-alert button',
};

/** Something only each signed-in screen renders, keyed by route path. */
export const SCREEN_MARKERS: Record<string, string> = {
  'personal-information': byTestId('personal-submit'),
  'personal-document': byTestId('document-submit'),
  'vehicle-details': byTestId('vehicle-submit'),
  'backing-details': byTestId('bank-submit'),
  order: byTestId('order-empty'),
  account: byTestId('account-name'),
  'track-map': byTestId('track-empty'),
};
