import { LocationErrorKind } from '@appTypes/location.types';

/** One GPS attempt with these options (no retries). */
export const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
} as const;

/** Capacitor permission aliases requested on native. */
export const LOCATION_PERMISSIONS = {
  ALIASES: ['location', 'coarseLocation'],
  GRANTED: 'granted',
} as const;

/** Web GeolocationPositionError codes. */
export const GEO_ERROR_CODES = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as const;

/** Lower-case fragments in native error messages that identify each failure. */
export const GEO_ERROR_HINTS: Record<Exclude<LocationErrorKind, 'unknown'>, readonly string[]> = {
  'permission-denied': ['denied', 'permission'],
  timeout: ['timeout', 'timed out'],
  unavailable: ['unavailable', 'disabled', 'not available'],
};

export const LOCATION_MESSAGES: Record<LocationErrorKind, string> = {
  'permission-denied': 'Location permission is off. Type your address instead.',
  timeout: 'Getting your location took too long. Type your address instead.',
  unavailable: 'Your location is not available right now. Type your address instead.',
  unknown: 'Could not get your location. Type your address instead.',
};

export const LOCATION_ERROR_NAME = 'LocationError';
