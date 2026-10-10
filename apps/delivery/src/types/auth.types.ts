/** Login form model (Signal Forms). */
export interface LoginFormState {
  email: string;
  password: string;
}

/** Accept-invite form model (Signal Forms): the rider's new password, typed twice. */
export interface WelcomeFormState {
  password: string;
  confirmPassword: string;
}

/** Accept-invite screen: reading the invite link, link expired, or choosing a password. */
export type WelcomeState = 'checking' | 'no-session' | 'ready';

/** Forgot-password form model (Signal Forms). */
export interface ForgotPasswordFormState {
  email: string;
}
