/** Alert and toast copy used from TypeScript. Template-only text stays in the templates (Rule 21). */
export const ALERT_TITLES = {
  LOGIN: 'Login',
  LOGIN_FAILED: 'Login Failed',
  REGISTRATION_SUCCESS: 'Registration Success',
  REGISTRATION_FAILED: 'Registration Failed',
  FORGOT_PASSWORD: 'Forget Password',
  OTP: 'OTP',
  PASSWORD: 'Password',
  CONFIGURATION: 'Configuration',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN: 'Login Successfully',
  REGISTERED: 'The Account Created Successfully',
  RESET_EMAIL_SENT: 'Please check the Email box',
  OTP_SENT: 'Send the Otp Successfully',
} as const;

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  EMAIL_IN_USE: 'The email address is already in use by another account',
  NOT_SIGNED_IN: 'Not signed in.',
  SUPABASE_SERVER_ONLY: 'Supabase is browser-only and is not available during server rendering.',
  supabaseNotConfigured: (env: string) => `Supabase is not configured for the "${env}" environment. Set supabase.url and supabase.anonKey in the environment file.`,
} as const;

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required.',
  EMAIL_INVALID: 'Enter a valid email.',
  PASSWORD_REQUIRED: 'Password is required.',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters long.',
  NAME_REQUIRED: 'Name is required.',
  CONFIRM_PASSWORD_REQUIRED: 'Confirm Password is required.',
  PASSWORDS_MUST_MATCH: 'Passwords must match.',
  PHONE_REQUIRED: 'Phone Number is required.',
  PHONE_PATTERN: 'Phone Number must be 10 digits.',
  OTP_REQUIRED: 'Otp is required.',
  FULL_NAME_REQUIRED: 'Full Name is required.',
  FULL_NAME_MIN_LENGTH: 'Full Name must be at least 3 characters long.',
  CURRENT_PASSWORD_REQUIRED: 'Current password is required.',
  NEW_PASSWORD_REQUIRED: 'New password is required.',
  GUESTS_MIN: 'Guests must be at least 1',
  DATE_REQUIRED: 'Date is required',
  TIME_REQUIRED: 'Time is required',
  FIRST_NAME_REQUIRED: 'First name is required',
  LAST_NAME_REQUIRED: 'Last name is required',
} as const;

/** Shown when a stubbed data action is used (Phase 8 wires the tables). */
export const NOT_CONNECTED = {
  TOAST: 'Not connected yet',
  ERROR_NAME: 'NotImplementedError',
  prefix: (operation: string) => `Not connected yet: ${operation}`,
} as const;

/** Names of the stubbed operations (used in NotImplementedError messages). */
export const STUB_OPERATIONS = {
  ADD_TO_CART: 'add to cart',
  CLEAR_CART: 'clear cart',
  UPDATE_CART: 'update cart',
  SAVE_ORDER_HISTORY: 'save order to user history',
  PLACE_ORDER: 'place order',
  SAVE_BOOKING_HISTORY: 'save booking to user history',
  BOOK_TABLE: 'book table',
  UPDATE_ACCOUNT: 'update account',
} as const;
