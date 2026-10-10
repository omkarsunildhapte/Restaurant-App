import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
/** Google Maps JS loader for map DISPLAY only (no geocoding). Device position: core/location.service.ts. */
export class GeolocationService {
  private readonly platformId = inject(PLATFORM_ID);
  constructor() { }
  loadGoogleMaps(): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(new Error('Google Maps is browser-only.'));
    }
    const win = window as any;
    const gModule = win.google;
    if (gModule && gModule.maps) {
      return Promise.resolve(gModule.maps);
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + environment.googleMapsApiKey + '&callback=Function.prototype';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => {
        const loadedGoogleModule = win.google;
        if (loadedGoogleModule && loadedGoogleModule.maps) {
          resolve(loadedGoogleModule.maps);
        } else {
        }
      };
    });
  }

  // TODO(Phase 8): Supabase table rider_locations (was Firestore doc track/DbRIAYjK3zsoc7JOUOUa)
  getLocation(): Observable<any> {
    return of(null);
  }

  async updateSourceLocation(source: any) {
    // try {
    //   const dataRef = this.docRef('track/DbRIAYjK3zsoc7JOUOUa');
    //   await updateDoc<any>(dataRef, { source });
    //   return true;
    // } catch (e) {
    //   throw (e);
    // }
  }
}
