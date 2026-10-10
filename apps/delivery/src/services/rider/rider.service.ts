import { Injectable } from '@angular/core';
import { RiderBankDetails, RiderDocuments, RiderPersonalInfo, RiderProfile, RiderVehicle } from '@appTypes/rider.types';
import { NotImplementedError } from '@utils/errors/errors.util';
import { PERSONAL_INFORMATION_PAGE } from '@constants/personal-information.constants';
import { PERSONAL_DOCUMENT_PAGE } from '@constants/personal-document.constants';
import { VEHICLE_DETAILS_PAGE } from '@constants/vehicle-details.constants';
import { BANK_DETAILS_PAGE } from '@constants/bank-details.constants';

/**
 * Rider onboarding data. Every method is a stub until Phase 5: reads resolve empty, writes reject
 * with NotImplementedError (the page then shows "Not connected yet"). Riders join a tenant
 * through an invitation (memberships), so sign-up may never create the `riders` row here.
 * Document images and payout details are sensitive: never log them.
 */
@Injectable({ providedIn: 'root' })
export class RiderService {
  // TODO(Phase 5): Supabase table riders
  async getProfile(_uid: string): Promise<RiderProfile | null> {
    return null;
  }

  // TODO(Phase 5): Supabase table riders
  async savePersonalInfo(_uid: string, _info: RiderPersonalInfo): Promise<void> {
    throw new NotImplementedError(PERSONAL_INFORMATION_PAGE.SAVE_OPERATION);
  }

  // TODO(Phase 5): Supabase table riders (photo_url, licence_url, id_proof_url) + a Storage bucket
  async saveDocuments(_uid: string, _documents: RiderDocuments): Promise<void> {
    throw new NotImplementedError(PERSONAL_DOCUMENT_PAGE.SAVE_OPERATION);
  }

  // TODO(Phase 5): Supabase table riders (vehicle_type, vehicle_number)
  async getVehicle(_uid: string): Promise<RiderVehicle | null> {
    return null;
  }

  // TODO(Phase 5): Supabase table riders (vehicle_type, vehicle_number)
  async saveVehicle(_uid: string, _vehicle: RiderVehicle): Promise<void> {
    throw new NotImplementedError(VEHICLE_DETAILS_PAGE.SAVE_OPERATION);
  }

  // TODO(Phase 5): Supabase table riders (upi_id)
  async getBankDetails(_uid: string): Promise<RiderBankDetails | null> {
    return null;
  }

  // TODO(Phase 5): Supabase table riders (upi_id)
  async saveBankDetails(_uid: string, _details: RiderBankDetails): Promise<void> {
    throw new NotImplementedError(BANK_DETAILS_PAGE.SAVE_OPERATION);
  }
}
