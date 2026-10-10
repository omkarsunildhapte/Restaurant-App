import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/** Minimal user info used to show names next to orders / bookings. */
export interface UserView {
  uid: string;
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class ProfilesDataService {
  // TODO(Phase 1): Supabase profiles (id, full_name, email)
  list(): Observable<UserView[]> {
    return of([]);
  }
}
