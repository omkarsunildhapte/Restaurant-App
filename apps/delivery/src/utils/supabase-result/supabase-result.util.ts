import { ERROR_MESSAGES } from '@constants/messages.constants';

/** The part of a supabase-js result every call returns. */
export interface SupabaseResult<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * The data of a supabase-js call, or an Error carrying the server's message (RLS and the
 * database functions word their errors for the rider, e.g. "Wrong OTP"). A network failure
 * comes back without a message and gets the generic one.
 */
export function unwrap<T>(result: SupabaseResult<T>): T | null {
  if (result.error) {
    throw new Error(result.error.message || ERROR_MESSAGES.DATA_FAILED);
  }
  return result.data;
}
