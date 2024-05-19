import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() { }
  getCurrentLocation(): Observable<GeolocationPosition> { 
    return new Observable((observer: Observer<GeolocationPosition>) => { 
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position: GeolocationPosition) => { 
            observer.next(position);
            observer.complete();
          },
          (error: GeolocationPositionError) => { 
            observer.error(error);
          }
        );
      } else {
        observer.error('Geolocation is not supported by this browser.');
      }
    });
  }
}
