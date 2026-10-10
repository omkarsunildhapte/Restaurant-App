import { Injectable } from '@angular/core';
import { EMPTY, Observable, throwError } from 'rxjs';
import { NotImplementedError } from './not-implemented';

export interface TrackPoint {
  lat: number;
  lng: number;
}

/** Live tracking (was Firestore `track/{id}`). Stub until Phase 5. */
@Injectable({ providedIn: 'root' })
export class TrackingDataService {
  // TODO(Phase 5): Supabase table rider_locations (realtime)
  watchLocation(): Observable<TrackPoint> {
    return EMPTY;
  }

  // TODO(Phase 5): Supabase table rider_locations
  updateSourceLocation(_point: TrackPoint): Observable<void> {
    return throwError(() => new NotImplementedError('update location'));
  }
}
