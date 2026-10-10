import { ERROR_MESSAGES } from '@constants/messages.constants';

/** A human-readable message for any thrown value (Supabase AuthError, Error, string, …). */
export function errorMessage(error: unknown, fallback: string = ERROR_MESSAGES.GENERIC): string {
  if (typeof error === 'string' && error) return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

/** The `code` of a Supabase/API error, if it has one. */
export function errorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}
