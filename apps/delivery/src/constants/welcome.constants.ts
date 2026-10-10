import { WelcomeFormState } from '@appTypes/auth.types';

/** Accept-invite screen (/welcome), where a restaurant's invite e-mail lands. */
export const WELCOME_PAGE = {
  ALERT_TITLE: 'Welcome',
  PASSWORD_MIN_LENGTH: 8,
  /** supabase-js reads the session from the invite link when it starts; wait this long for it. */
  SESSION_POLL_ATTEMPTS: 10,
  SESSION_POLL_INTERVAL_MS: 300,
  PASSWORDS_DIFFER_KIND: 'passwords-differ',
  EMPTY_FORM: { password: '', confirmPassword: '' } as WelcomeFormState,
} as const;
