import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { doc, onSnapshot } from '@angular/fire/firestore';
import { Observable, Observer } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  constructor(private firestore: AngularFirestore) { }
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
  loadGoogleMaps(): Promise<any> {
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

  getLocation() {
    let dataRef: any = 'track/DbRIAYjK3zsoc7JOUOUa'
    return new Observable<any>(observer => {
      onSnapshot(dataRef, (doc: any) => {
        observer.next(doc.data());
      })
    });
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
