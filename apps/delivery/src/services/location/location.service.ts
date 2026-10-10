import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Observable } from 'rxjs';
import { RiderPosition } from '@appTypes/location.types';
import { LocationError, toLocationError } from '@utils/errors/errors.util';
import { LOCATION_OPTIONS, LOCATION_PERMISSION } from '@constants/location.constants';

/** The Capacitor Geolocation plugin (a token so unit tests can supply a fake). */
export const GEOLOCATION_PLUGIN = new InjectionToken<typeof Geolocation>('GEOLOCATION_PLUGIN', { factory: () => Geolocation });

/** Whether the app runs inside the native Capacitor shell (a token so tests can choose). */
export const IS_NATIVE_PLATFORM = new InjectionToken<() => boolean>('IS_NATIVE_PLATFORM', { factory: () => () => Capacitor.isNativePlatform() });

/**
 * Device position through @capacitor/geolocation (navigator.geolocation on the web, which needs
 * HTTPS or localhost). On native, permission is requested before the first read. Nothing here
 * retries. Reverse-geocode only on a user tap (GeocodeService.reverse), never on every update.
 *
 * Not used by a page yet: kept for the Phase 5 live-tracking work (user rule on device location).
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly geolocation = inject(GEOLOCATION_PLUGIN);
  private readonly isNative = inject(IS_NATIVE_PLATFORM);

  async getCurrentPosition(options: PositionOptions = LOCATION_OPTIONS): Promise<RiderPosition> {
    await this.ensurePermission();
    try {
      return toRiderPosition(await this.geolocation.getCurrentPosition(options));
    } catch (error) {
      throw toLocationError(error);
    }
  }

  /** Emits the rider's position as it changes; unsubscribe to stop watching. */
  watchPosition(options: PositionOptions = LOCATION_OPTIONS): Observable<RiderPosition> {
    return new Observable<RiderPosition>((subscriber) => {
      let watchId: string | undefined;
      let stopped = false;
      this.ensurePermission()
        .then(() =>
          this.geolocation.watchPosition(options, (position, error) => {
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
            this.geolocation.clearWatch({ id });
          }
        })
        .catch((error: unknown) => subscriber.error(toLocationError(error)));
      return () => {
        stopped = true;
        if (watchId) {
          this.geolocation.clearWatch({ id: watchId });
        }
      };
    });
  }

  private async ensurePermission(): Promise<void> {
    if (!this.isBrowser) {
      throw new LocationError('unavailable');
    }
    if (!this.isNative()) {
      return;
    }
    let status;
    try {
      status = await this.geolocation.requestPermissions({ permissions: [LOCATION_PERMISSION.ALIAS] });
    } catch (error) {
      throw toLocationError(error);
    }
    if (status.location !== LOCATION_PERMISSION.GRANTED) {
      throw new LocationError('permission-denied');
    }
  }
}

function toRiderPosition(position: Position): RiderPosition {
  return { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, timestamp: position.timestamp };
}
