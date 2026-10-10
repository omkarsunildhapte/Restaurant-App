import { DeliveryStatus } from '@appTypes/order.types';
import { DeliverFormState, FailFormState, FailReasonOption, NextStepAction } from '@appTypes/tracking.types';

/** Track (delivery) screen. */
export const TRACK_MAP_PAGE = {
  ALERT_TITLE: 'Delivery',
  DELIVERED_MESSAGE: 'Delivered. Well done!',
  FAILED_MESSAGE: 'Marked as not delivered. The restaurant will decide what happens next.',
  /** The button for each in-progress status (advance_delivery); delivering is its own form. */
  NEXT_STEP: {
    assigned: { step: 'at_pickup', label: 'Reached restaurant' },
    at_pickup: { step: 'picked_up', label: 'Picked up the order' },
    picked_up: { step: 'at_drop', label: 'Reached customer' },
  } as Partial<Record<DeliveryStatus, NextStepAction>>,
  /** Statuses from which the order can be handed over (complete_delivery). */
  CAN_DELIVER: ['picked_up', 'at_drop'] as readonly DeliveryStatus[],
  /** Statuses from which the rider can report a failed delivery (fail_delivery). */
  CAN_FAIL: ['assigned', 'at_pickup', 'picked_up', 'at_drop'] as readonly DeliveryStatus[],
  OTP_PATTERN: /^\d{4}$/,
  CASH_PATTERN: /^\d+(\.\d{1,2})?$/,
  EMPTY_DELIVER_FORM: { otp: '', cash: '' } as DeliverFormState,
  EMPTY_FAIL_FORM: { reason: '' } as FailFormState,
  FAIL_REASONS: [
    { value: 'Customer not answering', label: 'Customer not answering' },
    { value: 'Wrong or incomplete address', label: 'Wrong or incomplete address' },
    { value: 'Customer refused the order', label: 'Customer refused the order' },
    { value: 'Customer asked to cancel', label: 'Customer asked to cancel' },
    { value: 'Vehicle problem', label: 'Vehicle problem' },
  ] as readonly FailReasonOption[],
} as const;

/** Link schemes the phone opens in its own apps (maps, dialler); no maps API is called. */
export const DEVICE_LINKS = {
  GEO_PREFIX: 'geo:',
  TEL_PREFIX: 'tel:',
} as const;
