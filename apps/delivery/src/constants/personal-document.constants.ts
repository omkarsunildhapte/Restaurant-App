import { RiderDocumentField, RiderDocumentFile, RiderDocumentKey } from '@appTypes/rider.types';

/** Personal document screen. */
export const PERSONAL_DOCUMENT_PAGE = {
  ALERT_TITLE: 'Personal Document',
  IMAGE_MIME_PREFIX: 'image/',
  /** What the file picker offers (the bucket takes PNG, JPEG and WebP only). */
  ACCEPT: 'image/png,image/jpeg,image/webp',
  SAVE_OPERATION: 'save documents',
  FIELDS: [
    { key: 'profile', inputId: 'file-upload-profile', label: 'Your Profile' },
    { key: 'drivingLicence', inputId: 'file-upload-drivingLicence', label: 'Your Driving Licence' },
    { key: 'nationalId', inputId: 'file-upload-nationalId', label: 'Your National Id' },
  ] as readonly RiderDocumentField[],
} as const;

/** Where each document is stored: the riders column holding its path, and its file name. */
export const RIDER_DOCUMENT_FILES: Record<RiderDocumentKey, RiderDocumentFile> = {
  profile: { column: 'photo_url', name: 'photo' },
  drivingLicence: { column: 'licence_url', name: 'licence' },
  nationalId: { column: 'id_proof_url', name: 'id-proof' },
};

/** Phone photos are shrunk before upload so they stay under the bucket's 2 MB limit. */
export const DOCUMENT_IMAGE = {
  MAX_SIDE_PX: 1600,
  QUALITY: 0.82,
  OUTPUT_MIME: 'image/jpeg',
  OUTPUT_EXTENSION: 'jpg',
  DATA_URL_PREFIX: 'data:',
  CANVAS_2D: '2d',
} as const;
