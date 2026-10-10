/** Result of an auth call that never throws (OTP send/verify). */
export interface AuthResult<T = unknown> {
  data: T | null;
  error: Error | null;
}

export interface LoginFormState {
  email: string;
  password: string;
}

export interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormState {
  email: string;
}

export interface PhoneFormState {
  phoneNumber: string;
}

export interface OtpFormState {
  otp: string;
}

export interface ChangePasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Which password box's visibility is being toggled. */
export type PasswordField = 'current' | 'new' | 'confirm';
