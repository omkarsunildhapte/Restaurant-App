import { PersonalInfoField, RiderPersonalInfo } from '@appTypes/rider.types';

/** Personal information screen. */
export const PERSONAL_INFORMATION_PAGE = {
  ALERT_TITLE: 'Personal Information',
  BLOOD_GROUPS: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as readonly string[],
  MOBILE_PATTERN: /^[0-9]{10}$/,
  DATE_FORMAT: 'yyyy-MM-dd',
  DATE_LOCALE: 'en-US',
  DATE_TRIGGER_ID: 'open-date',
  SAVE_OPERATION: 'save personal information',
  EMPTY_FORM: { firstName: '', lastName: '', fathersName: '', dateOfBirth: '', mobileNumber: '', bloodGroup: '', city: '', address: '', deliveryLicenseId: '', nationalId: '' } satisfies RiderPersonalInfo,
  /** Form rows in display order. */
  FIELDS: [
    { key: 'firstName', kind: 'text', placeholder: 'Please enter first name' },
    { key: 'lastName', kind: 'text', placeholder: 'Please enter last name' },
    { key: 'fathersName', kind: 'text', placeholder: 'Please enter father’s name' },
    { key: 'dateOfBirth', kind: 'date', placeholder: 'Please enter date of birth' },
    { key: 'mobileNumber', kind: 'text', placeholder: 'Please enter mobile number' },
    { key: 'bloodGroup', kind: 'select', placeholder: 'Please select blood group' },
    { key: 'city', kind: 'text', placeholder: 'Please enter city' },
    { key: 'address', kind: 'text', placeholder: 'Please enter address' },
    { key: 'deliveryLicenseId', kind: 'text', placeholder: 'Please enter delivery license ID' },
    { key: 'nationalId', kind: 'text', placeholder: 'Please enter National ID' },
  ] as readonly PersonalInfoField[],
} as const;
