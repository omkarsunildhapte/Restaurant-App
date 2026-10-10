import { Database } from '@appTypes/database.types';

/** A `riders` row (migration 0005). */
export type RiderRow = Database['public']['Tables']['riders']['Row'];

/** Super Admin's check of the rider's documents (`rider_verification` enum). */
export type RiderVerification = Database['public']['Enums']['rider_verification'];

/** A business this person rides for: a `my_workspaces()` row with the delivery role. */
export interface RiderWorkspace {
  tenantId: string;
  tenantName: string;
  /** null = every outlet of the business. */
  outletId: string | null;
  writable: boolean;
}

/** Rider profile as the app reads it (the `riders` row for the current business). */
export interface RiderProfile {
  uid: string;
  riderId: string;
  tenantId: string;
  displayName: string;
  phoneNumber?: string;
  verification: RiderVerification;
  rejectionReason: string | null;
  isActive: boolean;
  isOnline: boolean;
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

/** The three document images, as data URLs. Sensitive: never log. */
export interface RiderDocuments {
  profile: string;
  drivingLicence: string;
  nationalId: string;
}

/** Key of one document image. */
export type RiderDocumentKey = keyof RiderDocuments;

/** One upload card on the personal-document page. */
export interface RiderDocumentField {
  key: RiderDocumentKey;
  inputId: string;
  label: string;
}

/** Mirrors the `vehicle_type` enum in supabase/migrations (delivery). */
export type VehicleType = 'bicycle' | 'scooter' | 'motorcycle' | 'ev_scooter' | 'on_foot';

/** Vehicle details form (riders.vehicle_type, riders.vehicle_number). */
export interface RiderVehicle {
  vehicleType: VehicleType | '';
  vehicleNumber: string;
}

/** One choice in the vehicle-type select. */
export interface VehicleTypeOption {
  value: VehicleType;
  label: string;
}

/** Payout details form (riders.upi_id; the schema has no bank-account table). Sensitive: never log. */
export interface RiderBankDetails {
  upiId: string;
}

/** How one personal-information field is rendered. */
export type PersonalInfoFieldKind = 'text' | 'date' | 'select';

/** One row of the personal-information form. */
export interface PersonalInfoField {
  key: keyof RiderPersonalInfo;
  kind: PersonalInfoFieldKind;
  placeholder: string;
}
