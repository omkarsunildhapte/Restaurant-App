import { DeliveryStep, MapPoint, RiderOrder } from '@appTypes/order.types';

/** A point on the map. */
export type TrackPoint = MapPoint;

/** The delivery the track-map page follows: the rider's newest open job. */
export type ActiveDelivery = RiderOrder;

/** The next step button on a job: the status it moves to and its label. */
export interface NextStepAction {
  step: DeliveryStep;
  label: string;
}

/** What the track page's lower card shows. */
export type TrackPanel = 'details' | 'deliver' | 'fail';

/** "Delivered" form: the customer's OTP and, for cash on delivery, the cash taken (typed as text). */
export interface DeliverFormState {
  otp: string;
  cash: string;
}

/** "Could not deliver" form. */
export interface FailFormState {
  reason: string;
}

/** One choice in the could-not-deliver reason list. */
export interface FailReasonOption {
  value: string;
  label: string;
}
