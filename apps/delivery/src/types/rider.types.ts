/** Rider profile as the onboarding flow reads it (TODO(Phase 5): Supabase table riders). */
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
