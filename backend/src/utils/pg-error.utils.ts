import { ErrorCodes, HttpStatus } from '@type/utils/app-error.enum.js';
import { AppError } from '@utils/app-error.utils.js';

/**
 * Postgres error codes raised by our SQL functions and constraints, as HTTP. The functions already
 * write readable messages (e.g. "Only an owner or admin can invite staff"), so the message is kept.
 */
const pgToHttp: Record<string, [number, (typeof ErrorCodes)[keyof typeof ErrorCodes]]> = {
  '42501': [HttpStatus.FORBIDDEN, ErrorCodes.FORBIDDEN], // insufficient privilege / RLS
  '22023': [HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR], // invalid parameter
  '23505': [HttpStatus.CONFLICT, ErrorCodes.ALREADY_EXISTS], // unique violation
  '23503': [HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR], // foreign key
  P0001: [HttpStatus.BAD_REQUEST, ErrorCodes.BUSINESS_RULE], // raise exception in our functions
  P0002: [HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND], // no_data_found
};

interface SupabaseResult<T> {
  data: T;
  error: { code?: string; message: string } | null;
}

/** Returns the data of a Supabase call, or throws it as an AppError. */
export function check<T>(result: SupabaseResult<T>): T {
  if (result.error) {
    const [status, code] = pgToHttp[result.error.code ?? ''] ?? [HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR];
    throw new AppError(result.error.message, status, code);
  }
  return result.data;
}
