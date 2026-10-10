import { LocationErrorKind } from '@appTypes/location.types';
import { GEO_ERROR_CODES, GEO_ERROR_HINTS, LOCATION_ERROR_NAME, LOCATION_MESSAGES } from '@constants/location.constants';

/** A device-location failure with a message the screen can show as-is. */
export class LocationError extends Error {
  constructor(public readonly kind: LocationErrorKind) {
    super(LOCATION_MESSAGES[kind]);
    this.name = LOCATION_ERROR_NAME;
  }
}

const hints = (message: string, kind: Exclude<LocationErrorKind, 'unknown'>): boolean => GEO_ERROR_HINTS[kind].some((hint) => message.includes(hint));

/**
 * Maps a web GeolocationPositionError (codes 1/2/3) or a Capacitor native error (by message)
 * onto one of the four kinds.
 */
export function toLocationError(e: unknown): LocationError {
  if (e instanceof LocationError) return e;
  const err = e as { code?: number | string; message?: string } | null;
  const code = err?.code;
  const message = (err?.message ?? '').toLowerCase();
  if (code === GEO_ERROR_CODES.PERMISSION_DENIED || hints(message, 'permission-denied')) return new LocationError('permission-denied');
  if (code === GEO_ERROR_CODES.TIMEOUT || hints(message, 'timeout')) return new LocationError('timeout');
  if (code === GEO_ERROR_CODES.POSITION_UNAVAILABLE || hints(message, 'unavailable')) return new LocationError('unavailable');
  return new LocationError('unknown');
}
