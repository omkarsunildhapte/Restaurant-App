import { ERROR_MESSAGES, notConnectedMessage } from '@constants/messages.constants';
import { GEOLOCATION_ERROR_CODES, LOCATION_ERROR_HINTS, LOCATION_MESSAGES } from '@constants/location.constants';
import { LocationErrorReason } from '@appTypes/location.types';

/**
 * Thrown by the Phase 5 data stubs: Firestore was removed and the Supabase tables are not wired
 * yet, so every write rejects with this error and the page shows a "Not connected yet" toast.
 */
export class NotImplementedError extends Error {
  constructor(operation: string) {
    super(notConnectedMessage(operation));
    this.name = 'NotImplementedError';
  }
}

/** A Supabase Auth failure. `code` mirrors Supabase's error code when it has one. */
export class AuthServiceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

/** Any failure of the backend /geocode endpoints. */
export class GeocodeUnavailableError extends Error {
  constructor(public readonly reason?: unknown) {
    super(ERROR_MESSAGES.ADDRESS_LOOKUP_UNAVAILABLE);
    this.name = 'GeocodeUnavailableError';
  }
}

/** A device-position failure; `message` is safe to show, callers then offer a typed address. */
export class LocationError extends Error {
  constructor(public readonly reason: LocationErrorReason) {
    super(LOCATION_MESSAGES[reason]);
    this.name = 'LocationError';
  }
}

export function isNotImplemented(error: unknown): error is NotImplementedError {
  return error instanceof NotImplementedError;
}

/** The error's message, or `fallback` when it has none. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Maps a web GeolocationPositionError or a Capacitor plugin error to a LocationError. */
export function toLocationError(error: unknown): LocationError {
  if (error instanceof LocationError) {
    return error;
  }
  const e = error as { code?: number | string; message?: string } | null;
  const text = `${e?.code ?? ''} ${e?.message ?? ''}`.toLowerCase();
  const mentions = (hints: readonly string[]) => hints.some((hint) => text.includes(hint));
  if (e?.code === GEOLOCATION_ERROR_CODES.PERMISSION_DENIED || mentions(LOCATION_ERROR_HINTS.PERMISSION)) {
    return new LocationError('permission-denied');
  }
  if (e?.code === GEOLOCATION_ERROR_CODES.TIMEOUT || mentions(LOCATION_ERROR_HINTS.TIMEOUT)) {
    return new LocationError('timeout');
  }
  return new LocationError('unavailable');
}
