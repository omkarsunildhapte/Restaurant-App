import { RiderBankDetails } from '@appTypes/rider.types';

/** Payout (bank) details screen (URL /backing-details). The schema only has riders.upi_id. */
export const BANK_DETAILS_PAGE = {
  ALERT_TITLE: 'Bank Details',
  SAVE_OPERATION: 'save bank details',
  EMPTY_FORM: { upiId: '' } satisfies RiderBankDetails,
  UPI_PATTERN: /^[\w.-]{2,}@[a-zA-Z]{2,}$/,
} as const;
