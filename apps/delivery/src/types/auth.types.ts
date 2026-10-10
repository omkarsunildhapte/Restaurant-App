/** Login form model (Signal Forms). */
export interface LoginFormState {
  email: string;
  password: string;
}

/** Registration form model (Signal Forms). */
export interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Forgot-password form model (Signal Forms). */
export interface ForgotPasswordFormState {
  email: string;
}
