import { LocationErrorReason } from '@appTypes/location.types';

/** Options for every device position read. */
export const LOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
} as const;

/** Rider-facing message per failure reason (each offers the typed-address fallback). */
export const LOCATION_MESSAGES: Record<LocationErrorReason, string> = {
  'permission-denied': 'Location permission is off. Allow location access in settings, or type the address instead.',
  timeout: 'Getting your location took too long. Try again, or type the address instead.',
  unavailable: 'Your location is not available right now. Check that location is on, or type the address instead.',
};

/** Web GeolocationPositionError codes. */
export const GEOLOCATION_ERROR_CODES = { PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as const;

/** Words in a native plugin error message that identify the failure. */
export const LOCATION_ERROR_HINTS = {
  PERMISSION: ['denied', 'permission'] as readonly string[],
  TIMEOUT: ['timeout', 'timed out'] as readonly string[],
} as const;

/** Capacitor permission alias and its granted state. */
export const LOCATION_PERMISSION = { ALIAS: 'location', GRANTED: 'granted' } as const;
