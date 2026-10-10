import { RiderDocumentField } from '@appTypes/rider.types';

/** Personal document screen. */
export const PERSONAL_DOCUMENT_PAGE = {
  ALERT_TITLE: 'Personal Document',
  IMAGE_MIME_PREFIX: 'image/',
  SAVE_OPERATION: 'save documents',
  FIELDS: [
    { key: 'profile', inputId: 'file-upload-profile', label: 'Your Profile' },
    { key: 'drivingLicence', inputId: 'file-upload-drivingLicence', label: 'Your Driving Licence' },
    { key: 'nationalId', inputId: 'file-upload-nationalId', label: 'Your National Id' },
  ] as readonly RiderDocumentField[],
} as const;
