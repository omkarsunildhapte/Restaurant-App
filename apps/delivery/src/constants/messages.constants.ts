/** Validation copy shared by every form. */
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required.',
  EMAIL_INVALID: 'Enter a valid email.',
  PASSWORD_REQUIRED: 'Password is required.',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long.',
  CONFIRM_PASSWORD_REQUIRED: 'Confirm Password is required.',
  PASSWORDS_MISMATCH: 'Passwords must match.',
  FIRST_NAME_REQUIRED: 'First name is required.',
  LAST_NAME_REQUIRED: 'Last name is required.',
  FATHERS_NAME_REQUIRED: "Father's name is required.",
  DATE_OF_BIRTH_REQUIRED: 'Date of birth is required.',
  MOBILE_REQUIRED: 'Mobile number is required.',
  MOBILE_PATTERN: 'Mobile number must be 10 digits.',
  BLOOD_GROUP_REQUIRED: 'Blood group is required.',
  CITY_REQUIRED: 'City is required.',
  ADDRESS_REQUIRED: 'Address is required.',
  DELIVERY_LICENSE_REQUIRED: 'Delivery license ID is required.',
  NATIONAL_ID_REQUIRED: 'National ID is required.',
  DOCUMENT_PROFILE_REQUIRED: 'Please add your profile photo.',
  DOCUMENT_LICENCE_REQUIRED: 'Please add your driving licence.',
  DOCUMENT_NATIONAL_ID_REQUIRED: 'Please add your national ID.',
  VEHICLE_TYPE_REQUIRED: 'Vehicle type is required.',
  VEHICLE_NUMBER_REQUIRED: 'Vehicle number is required.',
  UPI_REQUIRED: 'UPI ID is required.',
  UPI_INVALID: 'Enter a valid UPI ID (name@bank).',
  OTP_REQUIRED: "Enter the customer's 4-digit OTP.",
  OTP_PATTERN: 'The OTP has 4 digits.',
  CASH_REQUIRED: 'Enter the cash you collected.',
  CASH_PATTERN: 'Enter an amount like 230 or 230.50.',
  FAIL_REASON_REQUIRED: 'Choose what went wrong.',
} as const;

/** Error copy (alerts and thrown errors). */
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong.',
  LOGIN_FAILED: 'Login failed.',
  PASSWORD_UPDATE_FAILED: 'Could not save the password. Try again.',
  RESET_FAILED: 'Could not send the reset e-mail.',
  SUPABASE_NOT_CONFIGURED: 'Supabase is not configured.',
  SUPABASE_SERVER: 'Supabase is not available during server rendering.',
  NOT_CONNECTED: 'Not connected yet',
  ADDRESS_LOOKUP_UNAVAILABLE: 'Address lookup not available yet',
  ADDRESS_QUERY_EMPTY: 'Enter an address to search.',
  SIGN_IN_FOR_ADDRESS: 'Sign in to look up addresses.',
  SIGN_IN_REQUIRED: 'Sign in again to continue.',
  NO_RESTAURANT: 'You are not a rider for any restaurant yet. Ask the restaurant to invite you with this e-mail.',
  PROFILE_FIRST: 'Fill in your personal information first.',
  DATA_FAILED: 'Could not reach the server. Check the internet and try again.',
} as const;

/** Builds the message shown when an environment has no Supabase url/anonKey. */
export function supabaseConfigMessage(environmentName: string): string {
  return `Supabase is not configured for the "${environmentName}" environment. Set supabase.url and supabase.anonKey in src/environments.`;
}

/** Message carried by NotImplementedError for one stubbed operation. */
export function notConnectedMessage(operation: string): string {
  return `${ERROR_MESSAGES.NOT_CONNECTED}: ${operation}`;
}
