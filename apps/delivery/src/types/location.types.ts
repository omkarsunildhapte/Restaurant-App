/** Why the device position could not be read. */
export type LocationErrorReason = 'permission-denied' | 'timeout' | 'unavailable';

/** The rider's device position. */
export interface RiderPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}
