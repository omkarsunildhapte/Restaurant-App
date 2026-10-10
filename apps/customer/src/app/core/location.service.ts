import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export type LocationErrorKind = 'permission-denied' | 'timeout' | 'unavailable' | 'unknown';

export interface DevicePosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export class LocationError extends Error {
  constructor(public readonly kind: LocationErrorKind, message: string) {
    super(message);
    this.name = 'LocationError';
  }
}

const MESSAGES: Record<LocationErrorKind, string> = {
  'permission-denied': 'Location permission is off. Type your address instead.',
  timeout: 'Getting your location took too long. Type your address instead.',
  unavailable: 'Your location is not available right now. Type your address instead.',
  unknown: 'Could not get your location. Type your address instead.',
};

/**
 * The single device-location service (Capacitor Geolocation; uses navigator.geolocation on
 * the web, the native runtime permission prompt on Android). Call it only from a user tap,
 * never automatically or on a timer. One attempt per call, no retries.
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly platformId = inject(PLATFORM_ID);

  async getCurrentPosition(): Promise<DevicePosition> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new LocationError('unavailable', MESSAGES.unavailable);
    }
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
        if (status.location !== 'granted' && status.coarseLocation !== 'granted') {
          throw new LocationError('permission-denied', MESSAGES['permission-denied']);
        }
      }
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
    } catch (e) {
      throw toLocationError(e);
    }
  }
}

function toLocationError(e: unknown): LocationError {
  if (e instanceof LocationError) return e;
  const err = e as { code?: number | string; message?: string } | null;
  const code = err?.code;
  const msg = (err?.message ?? '').toLowerCase();
  // Web GeolocationPositionError codes: 1 denied, 2 unavailable, 3 timeout.
  // Capacitor native errors: OS-PLUG-GLOC-0003 denied, ...-0010 timeout, plus message text.
  if (code === 1 || msg.includes('denied') || msg.includes('permission')) {
    return new LocationError('permission-denied', MESSAGES['permission-denied']);
  }
  if (code === 3 || msg.includes('timeout') || msg.includes('timed out')) {
    return new LocationError('timeout', MESSAGES.timeout);
  }
  if (code === 2 || msg.includes('unavailable') || msg.includes('disabled') || msg.includes('not available')) {
    return new LocationError('unavailable', MESSAGES.unavailable);
  }
  return new LocationError('unknown', MESSAGES.unknown);
}
