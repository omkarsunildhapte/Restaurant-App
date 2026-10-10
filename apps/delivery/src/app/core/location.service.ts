import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Observable } from 'rxjs';

export type LocationErrorReason = 'permission-denied' | 'timeout' | 'unavailable';

/**
 * Typed location failure. `message` is safe to show to the rider; callers should then offer a
 * typed-address fallback. Nothing in this service retries.
 */
export class LocationError extends Error {
  constructor(public readonly reason: LocationErrorReason, message: string) {
    super(message);
    this.name = 'LocationError';
  }
}

export interface RiderPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
};

const MESSAGES: Record<LocationErrorReason, string> = {
  'permission-denied':
    'Location permission is off. Allow location access in settings, or type the address instead.',
  timeout: 'Getting your location took too long. Try again, or type the address instead.',
  unavailable:
    'Your location is not available right now. Check that location is on, or type the address instead.',
};

/**
 * Device position through @capacitor/geolocation (navigator.geolocation on the web, which needs
 * HTTPS or localhost). On native, permission is requested before the first read.
 * Do not reverse-geocode on every update; call GeocodeService.reverse() only on a user tap.
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async getCurrentPosition(options: PositionOptions = DEFAULT_OPTIONS): Promise<RiderPosition> {
    await this.ensurePermission();
    try {
      return toRiderPosition(await Geolocation.getCurrentPosition(options));
    } catch (error) {
      throw toLocationError(error);
    }
  }

  /** Emits the rider's position as it changes; unsubscribe to stop watching. */
  watchPosition(options: PositionOptions = DEFAULT_OPTIONS): Observable<RiderPosition> {
    return new Observable<RiderPosition>((subscriber) => {
      let watchId: string | undefined;
      let stopped = false;
      this.ensurePermission()
        .then(() =>
          Geolocation.watchPosition(options, (position, error) => {
            if (error) {
              subscriber.error(toLocationError(error));
            } else if (position) {
              subscriber.next(toRiderPosition(position));
            }
          }),
        )
        .then((id) => {
          watchId = id;
          if (stopped) {
            Geolocation.clearWatch({ id });
          }
        })
        .catch((error) => subscriber.error(toLocationError(error)));
      return () => {
        stopped = true;
        if (watchId) {
          Geolocation.clearWatch({ id: watchId });
        }
      };
    });
  }

  private async ensurePermission(): Promise<void> {
    if (!this.isBrowser) {
      throw new LocationError('unavailable', MESSAGES.unavailable); // SSR: no device
    }
    if (!Capacitor.isNativePlatform()) {
      return; // the browser prompts on first use
    }
    let status;
    try {
      status = await Geolocation.requestPermissions({ permissions: ['location'] });
    } catch (error) {
      throw toLocationError(error);
    }
    if (status.location !== 'granted') {
      throw new LocationError('permission-denied', MESSAGES['permission-denied']);
    }
  }
}

function toRiderPosition(position: Position): RiderPosition {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
}

function toLocationError(error: unknown): LocationError {
  if (error instanceof LocationError) {
    return error;
  }
  const e = error as { code?: number | string; message?: string } | null;
  const text = `${e?.code ?? ''} ${e?.message ?? ''}`.toLowerCase();
  // Web GeolocationPositionError codes: 1 denied, 2 unavailable, 3 timeout.
  if (e?.code === 1 || text.includes('denied') || text.includes('permission')) {
    return new LocationError('permission-denied', MESSAGES['permission-denied']);
  }
  if (e?.code === 3 || text.includes('timeout') || text.includes('timed out')) {
    return new LocationError('timeout', MESSAGES.timeout);
  }
  return new LocationError('unavailable', MESSAGES.unavailable);
}
