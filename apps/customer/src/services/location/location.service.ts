import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { DevicePosition } from '@appTypes/location.types';
import { GEOLOCATION_OPTIONS, LOCATION_PERMISSIONS } from '@constants/location.constants';
import { LocationError, toLocationError } from '@utils/location-error/location-error.util';

/**
 * The single device-location service (Capacitor Geolocation: navigator.geolocation on the web, the
 * runtime permission prompt on Android). Call only from a user tap. One attempt, no retries.
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async getCurrentPosition(): Promise<DevicePosition> {
    if (!this.isBrowser) throw new LocationError('unavailable');
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Geolocation.requestPermissions({ permissions: [...LOCATION_PERMISSIONS.ALIASES] });
        if (status.location !== LOCATION_PERMISSIONS.GRANTED && status.coarseLocation !== LOCATION_PERMISSIONS.GRANTED) {
          throw new LocationError('permission-denied');
        }
      }
      const pos = await Geolocation.getCurrentPosition({ ...GEOLOCATION_OPTIONS });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
    } catch (e) {
      throw toLocationError(e);
    }
  }
}
