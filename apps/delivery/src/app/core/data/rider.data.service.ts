import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { NotImplementedError } from './not-implemented';

/** Rider profile as the onboarding pages used it (was Firestore `deliveryPatner/{uid}`). */
export interface RiderProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
}

/** Personal information form (personal-information page). */
export interface RiderPersonalInfo {
  firstName: string;
  lastName: string;
  fathersName: string;
  dateOfBirth: string;
  mobileNumber: string;
  bloodGroup: string;
  city: string;
  address: string;
  deliveryLicenseId: string;
  nationalId: string;
}

/** Document images as data URLs (personal-document page). Sensitive: never log. */
export interface RiderDocuments {
  profile: string;
  drivingLicence: string;
  nationalId: string;
  personalStatus: number;
  documentStatus: number;
}

/** Vehicle details (vehicle-details page; the page has no form yet). */
export interface RiderVehicle {
  vehicleType: string;
  vehicleNumber: string;
}

/** Bank details (backing-details page; the page has no form yet). Sensitive: never log. */
export interface RiderBankDetails {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  upiId?: string;
}

/**
 * Rider onboarding data. Firestore was removed; every method is a stub until Phase 5.
 * Reads return empty results, writes fail with NotImplementedError.
 */
@Injectable({ providedIn: 'root' })
export class RiderDataService {
  // TODO(Phase 5): Supabase table riders
  getProfile(_uid: string): Observable<RiderProfile | null> {
    return of(null);
  }

  // TODO(Phase 5): Supabase table riders (riders are invited through memberships, so sign-up
  // may not create the row here at all)
  createProfileIfMissing(_profile: RiderProfile): Observable<void> {
    return of(undefined);
  }

  // TODO(Phase 5): Supabase table riders
  savePersonalInfo(_uid: string, _info: RiderPersonalInfo): Observable<void> {
    return throwError(() => new NotImplementedError('save personal information'));
  }

  // TODO(Phase 5): Supabase table riders (photo_url, licence_url, id_proof_url) + Storage bucket
  saveDocuments(_uid: string, _documents: RiderDocuments): Observable<void> {
    return throwError(() => new NotImplementedError('save documents'));
  }

  // TODO(Phase 5): Supabase table riders (vehicle_type, vehicle_number)
  getVehicle(_uid: string): Observable<RiderVehicle | null> {
    return of(null);
  }

  // TODO(Phase 5): Supabase table riders (vehicle_type, vehicle_number)
  saveVehicle(_uid: string, _vehicle: RiderVehicle): Observable<void> {
    return throwError(() => new NotImplementedError('save vehicle details'));
  }

  // TODO(Phase 5): Supabase table <bank details: not in the schema yet; riders.upi_id exists>
  getBankDetails(_uid: string): Observable<RiderBankDetails | null> {
    return of(null);
  }

  // TODO(Phase 5): Supabase table <bank details: not in the schema yet; riders.upi_id exists>
  saveBankDetails(_uid: string, _details: RiderBankDetails): Observable<void> {
    return throwError(() => new NotImplementedError('save bank details'));
  }
}
